import { useEffect, useState } from 'react'
import { supabase } from '../functions/supabase'

interface Match {
  match_id: string;
  match_date: string;
  match_time_utc: string | null;
  match_status: string;
  home_id: string;
  home_name: string;
  home_score: number | null;
  home_penalty: number | null;
  away_id: string;
  away_name: string;
  away_score: number | null;
  away_penalty: number | null;
  match_round: string;
}

interface TeamInfo {
  team_id: string;
  team_shortname: string | null;
  team_crest_url: string | null;
}

interface Props {
  selectedTournament: string;
}

export default function FixtureTable({ selectedTournament }: Props) {
  const [matchesByRound, setMatchesByRound] = useState<Record<string, Match[]>>({})
  const [teamLookup, setTeamLookup] = useState<Record<string, TeamInfo>>({})
  const [selectedRound, setSelectedRound] = useState<string>('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!selectedTournament) {
      setMatchesByRound({})
      return
    }

    const fetchFixture = async () => {
      setLoading(true)
      
      // Traemos los partidos del torneo seleccionado
      const { data: matches } = await supabase
        .from('matches')
        .select('*')
        .eq('tournament_id', selectedTournament)
        .order('match_date', { ascending: false })

      // Traemos los equipos para obtener los escudos y nombres cortos
      const { data: teams } = await supabase
        .from('teams')
        .select('team_id, team_shortname, team_crest_url')

      if (teams) {
        const lookup: Record<string, TeamInfo> = {}
        teams.forEach(t => {
          lookup[t.team_id] = t
        })
        setTeamLookup(lookup)
      }

      if (matches) {
        // Ordenar en memoria para arreglar el cruce de medianoche en UTC
        matches.sort((a, b) => {
          if (a.match_date !== b.match_date) {
            return a.match_date < b.match_date ? 1 : -1
          }
          
          const timeA = a.match_time_utc || '00:00:00'
          const timeB = b.match_time_utc || '00:00:00'
          
          const getAdjustedTime = (t: string) => {
            const hours = parseInt(t.substring(0, 2))
            return hours < 10 ? (hours + 24).toString() + t.substring(2) : t
          }
          
          const adjA = getAdjustedTime(timeA)
          const adjB = getAdjustedTime(timeB)
          
          return adjA < adjB ? 1 : -1
        })

        // Agrupar por fecha/ronda
        const grouped: Record<string, Match[]> = {}
        matches.forEach((m: Match) => {
          const round = m.match_round || 'Sin Fecha'
          if (!grouped[round]) grouped[round] = []
          grouped[round].push(m)
        })
        setMatchesByRound(grouped)
        const allRounds = Object.keys(grouped)
        if (allRounds.length > 0) setSelectedRound(allRounds[0])
      } else {
        setMatchesByRound({})
        setSelectedRound('')
      }
      
      setLoading(false)
    }

    fetchFixture()
  }, [selectedTournament])

  if (!selectedTournament) return null
  
  if (loading) return <div className="text-center text-zinc-500 py-10 font-mono">Cargando fixture...</div>

  const rounds = Object.keys(matchesByRound)

  if (rounds.length === 0) {
    return <div className="text-center text-zinc-500 py-10 font-mono">No hay partidos programados para este torneo.</div>
  }

  return (
    <div className="max-w-4xl mx-auto p-4 mt-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-zinc-100 text-lg font-bold uppercase tracking-wider">Fixture</h2>
        <select 
          className="bg-zinc-900 border border-zinc-700 text-zinc-100 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 outline-none font-mono"
          value={selectedRound}
          onChange={(e) => setSelectedRound(e.target.value)}
        >
          {rounds.map(r => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>
      
      <div className="space-y-8">
        {selectedRound && matchesByRound[selectedRound] && (
          <div className="bg-neutral-950 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
            <div className="bg-zinc-900 px-4 py-2 border-b border-zinc-800">
              <h3 className="text-zinc-300 font-mono text-sm uppercase font-bold">{selectedRound}</h3>
            </div>
            <div className="divide-y divide-zinc-800/50">
              {matchesByRound[selectedRound].map(match => {
                const homeTeam = teamLookup[match.home_id]
                const awayTeam = teamLookup[match.away_id]
                
                const homeName = homeTeam?.team_shortname || match.home_name
                const awayName = awayTeam?.team_shortname || match.away_name
                const homeCrest = homeTeam?.team_crest_url || ''
                const awayCrest = awayTeam?.team_crest_url || ''
                
                const isFinished = match.match_status.toLowerCase().includes('finalizado') || 
                                   match.match_status.toLowerCase().includes('term')

                return (
                  <div key={match.match_id} className="flex items-center justify-between px-4 py-3 hover:bg-zinc-900/50 transition-colors">
                    {/* Fecha/Estado */}
                    <div className="w-24 text-left text-xs font-mono text-zinc-500 flex flex-col justify-center">
                      {isFinished ? (
                        <span className="text-zinc-600 font-semibold">FINAL</span>
                      ) : (
                        <>
                          <span>{match.match_date.substring(5).replace('-', '/')}</span>
                          {match.match_time_utc && (
                            <span className="text-[10px] text-zinc-600">{match.match_time_utc.substring(0, 5)}</span>
                          )}
                        </>
                      )}
                    </div>

                    {/* Local */}
                    <div className="flex-1 flex items-center justify-end gap-3">
                      <span className="text-zinc-300 font-semibold text-sm whitespace-nowrap hidden sm:block">{homeName}</span>
                      <span className="text-zinc-300 font-semibold text-sm whitespace-nowrap sm:hidden">{homeName.substring(0, 3).toUpperCase()}</span>
                      {homeCrest ? (
                        <img src={homeCrest} alt={homeName} className="w-6 h-6 object-contain" />
                      ) : (
                        <div className="w-6 h-6 bg-zinc-800 rounded-full flex items-center justify-center">
                          <span className="text-[8px] text-zinc-500">{homeName.substring(0,2)}</span>
                        </div>
                      )}
                    </div>

                    {/* Resultado */}
                    <div className="w-auto min-w-[5rem] px-2 mx-4 flex items-center justify-center bg-black rounded-lg py-1 border border-zinc-800">
                      {match.home_penalty !== null && (
                        <span className="text-zinc-500 font-mono text-xs mr-2">({match.home_penalty})</span>
                      )}
                      <span className="text-zinc-100 font-bold font-mono text-base">
                        {match.home_score !== null ? match.home_score : '-'}
                      </span>
                      <span className="text-zinc-600 mx-1">-</span>
                      <span className="text-zinc-100 font-bold font-mono text-base">
                        {match.away_score !== null ? match.away_score : '-'}
                      </span>
                      {match.away_penalty !== null && (
                        <span className="text-zinc-500 font-mono text-xs ml-2">({match.away_penalty})</span>
                      )}
                    </div>

                    {/* Visitante */}
                    <div className="flex-1 flex items-center justify-start gap-3">
                      {awayCrest ? (
                        <img src={awayCrest} alt={awayName} className="w-6 h-6 object-contain" />
                      ) : (
                        <div className="w-6 h-6 bg-zinc-800 rounded-full flex items-center justify-center">
                          <span className="text-[8px] text-zinc-500">{awayName.substring(0,2)}</span>
                        </div>
                      )}
                      <span className="text-zinc-300 font-semibold text-sm whitespace-nowrap hidden sm:block">{awayName}</span>
                      <span className="text-zinc-300 font-semibold text-sm whitespace-nowrap sm:hidden">{awayName.substring(0, 3).toUpperCase()}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
