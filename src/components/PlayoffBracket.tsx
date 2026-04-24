import { useEffect, useState } from 'react'
import { supabase } from '../functions/supabase'

interface Match {
  match_id: string;
  home_id: string;
  away_id: string;
  home_score: number | null;
  away_score: number | null;
  home_penalty: number | null;
  away_penalty: number | null;
  match_round: string;
  match_status: string;
}

interface TeamInfo {
  team_id: string;
  team_shortname: string | null;
  team_crest_url: string | null;
}

interface Props {
  selectedTournament: string;
}

const ROUND_ORDER = ['octavos', 'cuartos', 'semifinal', 'final']

export default function PlayoffBracket({ selectedTournament }: Props) {
  const [knockoutMatches, setKnockoutMatches] = useState<Record<string, Match[]>>({})
  const [teamLookup, setTeamLookup] = useState<Record<string, TeamInfo>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!selectedTournament) return

    const fetchPlayoffs = async () => {
      setLoading(true)
      
      const { data: matches } = await supabase
        .from('matches')
        .select('match_id, home_id, away_id, home_score, away_score, home_penalty, away_penalty, match_round, match_status')
        .eq('tournament_id', selectedTournament)

      const { data: teams } = await supabase
        .from('teams')
        .select('team_id, team_shortname, team_crest_url')

      if (teams) {
        const lookup: Record<string, TeamInfo> = {}
        teams.forEach(t => { lookup[t.team_id] = t })
        setTeamLookup(lookup)
      }

      if (matches) {
        const grouped: Record<string, Match[]> = {
          'octavos': [],
          'cuartos': [],
          'semifinal': [],
          'final': []
        }

        matches.forEach(m => {
          if (!m.match_round) return
          const r = m.match_round.toLowerCase()
          // Si tiene número, es fase regular (ej: Fecha 1), ignorar
          if (/\d/.test(r)) return

          if (r.includes('octavo')) grouped['octavos'].push(m)
          else if (r.includes('cuarto')) grouped['cuartos'].push(m)
          else if (r.includes('semifinal')) grouped['semifinal'].push(m)
          else if (r.includes('final')) grouped['final'].push(m)
        })

        setKnockoutMatches(grouped)
      }
      setLoading(false)
    }

    fetchPlayoffs()
  }, [selectedTournament])

  if (!selectedTournament || loading) return null

  // Si no hay ningún partido de playoffs, no mostramos el componente
  const hasPlayoffs = Object.values(knockoutMatches).some(arr => arr.length > 0)
  if (!hasPlayoffs) return null

  const renderTeam = (teamId: string, score: number | null, penalty: number | null, isWinner: boolean) => {
    const team = teamLookup[teamId]
    const name = team?.team_shortname || teamId
    const crest = team?.team_crest_url

    return (
      <div className={`flex items-center justify-between px-2 py-1 ${isWinner ? 'bg-zinc-800' : 'bg-black'} border-b border-zinc-800/50`}>
        <div className="flex items-center gap-2 overflow-hidden">
          {crest ? (
            <img src={crest} alt={name} className="w-5 h-5 object-contain" />
          ) : (
            <div className="w-5 h-5 bg-zinc-800 rounded-full flex items-center justify-center text-[8px] text-zinc-500">
              {name.substring(0, 2)}
            </div>
          )}
          <span className={`text-xs font-mono truncate ${isWinner ? 'text-zinc-100 font-bold' : 'text-zinc-400'}`}>
            {name}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {penalty !== null && <span className="text-[9px] text-zinc-500 font-mono">({penalty})</span>}
          <span className={`text-xs font-mono font-bold ${isWinner ? 'text-white' : 'text-zinc-500'}`}>
            {score !== null ? score : '-'}
          </span>
        </div>
      </div>
    )
  }

  const renderMatch = (match: Match) => {
    // Determinar ganador para negrita
    let homeWins = false
    let awayWins = false
    
    if (match.match_status.toLowerCase().includes('finalizado') || match.match_status.toLowerCase().includes('term')) {
      if (match.home_penalty !== null && match.away_penalty !== null) {
        homeWins = match.home_penalty > match.away_penalty
        awayWins = match.away_penalty > match.home_penalty
      } else if (match.home_score !== null && match.away_score !== null) {
        homeWins = match.home_score > match.away_score
        awayWins = match.away_score > match.home_score
      }
    }

    return (
      <div key={match.match_id} className="w-40 border border-zinc-700 rounded overflow-hidden shadow-lg mb-4 bg-black">
        {renderTeam(match.home_id, match.home_score, match.home_penalty, homeWins)}
        {renderTeam(match.away_id, match.away_score, match.away_penalty, awayWins)}
      </div>
    )
  }

  return (
    <div className="mt-8 mb-12">
      <h3 className="text-zinc-300 font-bold font-mono mb-6 bg-zinc-900 inline-block px-3 py-1 rounded border border-zinc-700">PLAYOFFS</h3>
      
      <div className="flex justify-center gap-8 overflow-x-auto pb-4">
        {ROUND_ORDER.map(roundKey => {
          const matches = knockoutMatches[roundKey]
          if (!matches || matches.length === 0) return null
          
          let roundName = 'FINAL'
          if (roundKey === 'octavos') roundName = 'OCTAVOS'
          if (roundKey === 'cuartos') roundName = 'CUARTOS'
          if (roundKey === 'semifinal') roundName = 'SEMIFINAL'

          return (
            <div key={roundKey} className="flex flex-col">
              <div className="text-center text-[10px] text-zinc-500 font-mono mb-4">{roundName}</div>
              <div className="flex flex-col justify-evenly flex-1 gap-4 h-full">
                {matches.map(m => renderMatch(m))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
