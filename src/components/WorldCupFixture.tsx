import { useEffect, useState } from 'react'
import { supabase } from '../functions/supabase'

interface Match {
  match_id: string
  match_date: string
  match_time_utc: string | null
  match_status: string
  home_id: string
  home_name: string
  home_score: number | null
  home_penalty: number | null
  away_id: string
  away_name: string
  away_score: number | null
  away_penalty: number | null
  match_round: string
}

interface TeamInfo {
  team_id: string
  team_name: string | null
  team_shortname: string | null
  team_crest_url: string | null
}

interface Tournament {
  tournament_id: string
  tournament_name: string
  tournament_crest_url: string | null
  tournament_teams: Record<string, string[]> | null
}

interface TeamStanding {
  team_id: string
  team_name: string
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  goalDiff: number
  points: number
}

export default function WorldCupFixture() {
  const [loading, setLoading] = useState(true)
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [matches, setMatches] = useState<Match[]>([])
  const [teamLookup, setTeamLookup] = useState<Record<string, TeamInfo>>({})
  const [selectedRound, setSelectedRound] = useState<string>('Fecha 1')

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)

      const { data: tournaments } = await supabase
        .from('tournaments')
        .select('tournament_id, tournament_name, tournament_crest_url, tournament_teams')
        .eq('tournament_id_api', 5930)
        .limit(1)

      if (!tournaments || tournaments.length === 0) {
        setLoading(false)
        return
      }

      const tourney = tournaments[0] as Tournament
      setTournament(tourney)

      const { data: matchData } = await supabase
        .from('matches')
        .select('*')
        .eq('tournament_id', tourney.tournament_id)
        .order('match_date', { ascending: true })

      if (matchData) {
        setMatches(matchData)
        const rounds = Array.from(new Set(matchData.map(m => m.match_round))).sort()
        if (rounds.length > 0 && !rounds.includes(selectedRound)) {
          setSelectedRound(rounds[0])
        }
      }

      const { data: teams } = await supabase
        .from('teams')
        .select('team_id, team_name, team_shortname, team_crest_url')

      if (teams) {
        const lookup: Record<string, TeamInfo> = {}
        teams.forEach(t => { lookup[t.team_id] = t })
        setTeamLookup(lookup)
      }

      setLoading(false)
    }

    fetchData()
  }, [])

  if (loading) return <div className="text-center text-zinc-500 py-10 font-mono text-sm">Cargando datos del mundial...</div>
  if (!tournament) return <div className="text-center text-zinc-600 py-10 font-mono text-sm">No se encontró el torneo del mundial.</div>

  const groups = tournament.tournament_teams || {}
  const groupKeys = Object.keys(groups).sort()

  const teamToGroup: Record<string, string> = {}
  for (const [group, teamIds] of Object.entries(groups)) {
    for (const tid of teamIds) {
      teamToGroup[tid] = group
    }
  }

  const matchesByGroup: Record<string, Match[]> = {}
  for (const m of matches) {
    const group = teamToGroup[m.home_id] || teamToGroup[m.away_id] || '?'
    if (!matchesByGroup[group]) matchesByGroup[group] = []
    matchesByGroup[group].push(m)
  }

  const calculateStandings = (groupName: string, teamIds: string[]): TeamStanding[] => {
    const table: Record<string, TeamStanding> = {}
    
    teamIds.forEach(id => {
      const team = teamLookup[id]
      table[id] = {
        team_id: id,
        team_name: team?.team_shortname || team?.team_name || id,
        played: 0, won: 0, drawn: 0, lost: 0,
        goalsFor: 0, goalsAgainst: 0, goalDiff: 0, points: 0
      }
    })

    const groupMatches = matchesByGroup[groupName] || []
    groupMatches.forEach(m => {
      if (m.home_score === null || m.away_score === null) return
      const isFinished = m.match_status.toLowerCase().includes('finalizado') || 
                         m.match_status.toLowerCase().includes('term')
      if (!isFinished) return

      const home = table[m.home_id]
      const away = table[m.away_id]
      if (!home || !away) return

      home.played++
      away.played++
      home.goalsFor += m.home_score!
      home.goalsAgainst += m.away_score!
      away.goalsFor += m.away_score!
      away.goalsAgainst += m.home_score!

      if (m.home_score! > m.away_score!) {
        home.won++; home.points += 3; away.lost++
      } else if (m.home_score! < m.away_score!) {
        away.won++; away.points += 3; home.lost++
      } else {
        home.drawn++; away.drawn++; home.points += 1; away.points += 1
      }
    })

    return Object.values(table).map(t => ({
      ...t, goalDiff: t.goalsFor - t.goalsAgainst
    })).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points
      if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff
      return b.goalsFor - a.goalsFor
    })
  }

  const allRounds = Array.from(new Set(matches.map(m => m.match_round))).sort()
  const filteredMatches = matches.filter(m => m.match_round === selectedRound)
  const matchesByDate: Record<string, Match[]> = {}
  for (const m of filteredMatches) {
    if (!matchesByDate[m.match_date]) matchesByDate[m.match_date] = []
    matchesByDate[m.match_date].push(m)
  }
  const sortedDates = Object.keys(matchesByDate).sort()

  return (
    <div className="max-w-[1600px] mx-auto p-4 mt-8">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-16 border-l-4 border-white pl-6">
        <div className="flex items-center gap-6">
          {tournament.tournament_crest_url && (
            <img src={tournament.tournament_crest_url} alt="" className="w-16 h-16 object-contain" />
          )}
          <h2 className="text-zinc-100 text-4xl font-black uppercase tracking-tighter">
            {tournament.tournament_name}
          </h2>
        </div>

        {/* Selector de Fechas (Movido al Header Principal) */}
        <div className="flex items-center bg-neutral-950 p-1 rounded-xl border border-zinc-800 shrink-0">
          {allRounds.map(round => (
            <button
              key={round}
              onClick={() => setSelectedRound(round)}
              className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                selectedRound === round
                  ? 'bg-white text-black shadow-lg shadow-white/10'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {round}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        <div className="lg:col-span-6 space-y-12">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-6 gap-y-10">
            {groupKeys.map(group => {
              const groupTeams = groups[group] || []
              const standings = calculateStandings(group, groupTeams)

              return (
                <div key={group} className="space-y-3">
                  <div className="flex items-center gap-1.5 px-1">
                    <span className="text-zinc-500 font-bold uppercase tracking-widest text-[11px]">Grupo</span>
                    <span className="bg-white text-black w-6 h-6 rounded flex items-center justify-center text-[11px] font-black">
                      {group}
                    </span>
                  </div>
                  
                  <div className="bg-neutral-950 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
                    <table className="w-full text-[9px] font-mono text-zinc-400 border-collapse table-fixed">
                      <thead>
                        <tr className="bg-zinc-900/50 text-zinc-600 border-b border-zinc-800">
                          <th className="p-2 text-center w-[10%]">#</th>
                          <th className="p-2 text-left w-[45%]">EQUIPO</th>
                          <th className="p-2 text-center font-bold text-zinc-400 w-[15%]">PTS</th>
                          <th className="p-2 text-center w-[15%]">J</th>
                          <th className="p-2 text-center w-[15%]">+/-</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-900">
                        {standings.map((team, idx) => {
                          const info = teamLookup[team.team_id]
                          return (
                            <tr key={team.team_id} className="hover:bg-zinc-900/30 transition-colors h-9">
                              <td className="p-2 text-center text-zinc-600 font-bold">{idx + 1}</td>
                              <td className="p-2 overflow-hidden">
                                <div className="flex items-center gap-2 overflow-hidden">
                                  {info?.team_crest_url ? (
                                    <img src={info.team_crest_url} className="w-3.5 h-3.5 object-contain flex-shrink-0" alt="" />
                                  ) : <div className="w-3.5 h-3.5 bg-zinc-800 rounded-full flex-shrink-0" />}
                                  <span className="text-zinc-100 font-bold truncate">
                                    {info?.team_name || team.team_name}
                                  </span>
                                </div>
                              </td>
                              <td className="p-2 text-center font-black text-white bg-white/5">{team.points}</td>
                              <td className="p-2 text-center">{team.played}</td>
                              <td className="p-2 text-center font-bold text-zinc-500">{team.goalDiff > 0 ? `+${team.goalDiff}` : team.goalDiff}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="lg:col-span-6 space-y-12">
          <div className="space-y-10">
            {sortedDates.map(date => {
              const dayMatches = matchesByDate[date]
              const formattedDate = date.substring(8, 10) + '/' + date.substring(5, 7)
              
              // Obtener nombre del día (Lunes, Martes, etc)
              const dateObj = new Date(date + 'T12:00:00') // Usar mediodía para evitar desfases de zona horaria
              const dayName = dateObj.toLocaleDateString('es-ES', { weekday: 'long' })

              return (
                <div key={date} className="space-y-3">
                  <div className="flex items-center gap-1.5 px-1">
                    <span className="text-zinc-500 font-bold uppercase tracking-widest text-[11px]">{dayName}</span>
                    <span className="bg-white text-black px-2 h-6 rounded flex items-center justify-center text-[11px] font-black">
                      {formattedDate}
                    </span>
                  </div>

                  <div className="bg-neutral-950 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
                    <table className="w-full text-[9px] font-mono text-zinc-400 border-collapse table-fixed">
                      <thead>
                        <tr className="bg-zinc-900/50 text-zinc-600 border-b border-zinc-800">
                          <th className="p-2 text-center w-[10%]">GRP</th>
                          <th className="p-2 text-center w-[15%]">HORA</th>
                          <th className="p-2 text-center w-[75%]">PARTIDO</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-900">
                        {dayMatches.map(match => {
                          const home = teamLookup[match.home_id]
                          const away = teamLookup[match.away_id]
                          const group = teamToGroup[match.home_id] || teamToGroup[match.away_id] || '?'

                          return (
                            <tr key={match.match_id} className="h-9 transition-colors hover:bg-zinc-900/30">
                              <td className="p-2 text-center text-zinc-600 font-bold">{group}</td>
                              <td className="p-2 text-center text-zinc-400">{match.match_time_utc?.substring(0, 5) || '--:--'}</td>
                              <td className="p-2 overflow-hidden">
                                <div className="flex items-center justify-center gap-4">
                                  <div className="flex items-center gap-1.5 min-w-0 flex-1 justify-end">
                                    <span className="text-zinc-100 font-bold truncate">{home?.team_name || match.home_name}</span>
                                    <img src={home?.team_crest_url || ''} className="w-3.5 h-3.5 object-contain flex-shrink-0" alt="" />
                                  </div>

                                  <div className="bg-black/50 border border-zinc-900 px-2 py-0.5 rounded min-w-[40px] text-center">
                                    <span className={`text-[10px] font-black font-mono ${match.home_score !== null ? 'text-white' : 'text-zinc-800'}`}>
                                      {match.home_score !== null ? `${match.home_score}-${match.away_score}` : 'VS'}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                    <img src={away?.team_crest_url || ''} className="w-3.5 h-3.5 object-contain flex-shrink-0" alt="" />
                                    <span className="text-zinc-100 font-bold truncate">{away?.team_name || match.away_name}</span>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  )
}
