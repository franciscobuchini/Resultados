import { useEffect, useState } from 'react'
import { supabase } from '../functions/supabase'
import PlayoffBracket from './PlayoffBracket'



interface Match {
  home_id: string;
  home_name: string;
  home_score: number | null;
  away_id: string;
  away_name: string;
  away_score: number | null;
  match_status: string;
  match_round: string;
}

interface TeamStanding {
  team_id: string;
  team_name: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
}

interface Props {
  selectedTournament: string;
}

export default function StandingsTable({ selectedTournament }: Props) {
  const [standings, setStandings] = useState<TeamStanding[]>([])
  const [zones, setZones] = useState<Record<string, string[]> | null>(null)
  const [loading, setLoading] = useState(false)



  // Calcular tabla cuando se selecciona un torneo
  useEffect(() => {
    if (!selectedTournament) {
      setStandings([])
      return
    }

    const fetchMatchesAndCalculate = async () => {
      setLoading(true)
      
      // Traemos las zonas del torneo si las tiene
      const { data: tourData } = await supabase
        .from('tournaments')
        .select('tournament_teams')
        .eq('tournament_id', selectedTournament)
        .single()
      
      if (tourData?.tournament_teams) {
        setZones(tourData.tournament_teams as Record<string, string[]>)
      } else {
        setZones(null)
      }

      // Traemos todos los partidos del torneo seleccionado
      const { data: matches } = await supabase
        .from('matches')
        .select('home_id, home_name, home_score, away_id, away_name, away_score, match_status, match_round')
        .eq('tournament_id', selectedTournament)
        .ilike('match_status', '%Finalizado%') // Solo partidos terminados

      if (!matches) {
        setStandings([])
        setLoading(false)
        return
      }

      // Diccionario para ir acumulando los puntos
      const tableMap: Record<string, TeamStanding> = {}

      const initTeam = (id: string, name: string) => {
        if (!tableMap[id]) {
          tableMap[id] = {
            team_id: id,
            team_name: name,
            played: 0,
            won: 0,
            drawn: 0,
            lost: 0,
            goalsFor: 0,
            goalsAgainst: 0,
            goalDiff: 0,
            points: 0
          }
        }
      }

      matches.forEach((m: Match) => {
        if (m.home_score === null || m.away_score === null) return
        
        // Ignorar partidos de eliminación directa (Octavos, Cuartos, Semifinal, Final)
        // Solo sumamos si match_round tiene algún número (ej: "Fecha 1")
        if (!m.match_round || !/\d/.test(m.match_round)) return

        initTeam(m.home_id, m.home_name)
        initTeam(m.away_id, m.away_name)

        const home = tableMap[m.home_id]
        const away = tableMap[m.away_id]

        home.played++
        away.played++
        
        home.goalsFor += m.home_score
        home.goalsAgainst += m.away_score
        
        away.goalsFor += m.away_score
        away.goalsAgainst += m.home_score

        if (m.home_score > m.away_score) {
          home.won++
          home.points += 3
          away.lost++
        } else if (m.home_score < m.away_score) {
          away.won++
          away.points += 3
          home.lost++
        } else {
          home.drawn++
          away.drawn++
          home.points += 1
          away.points += 1
        }
      })

      // Convertir a array y ordenar
      const sortedStandings = Object.values(tableMap).map(team => ({
        ...team,
        goalDiff: team.goalsFor - team.goalsAgainst
      })).sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points // 1. Puntos
        if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff // 2. Diferencia de gol
        if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor // 3. Goles a favor
        return a.team_name.localeCompare(b.team_name) // 4. Orden alfabético
      })

      setStandings(sortedStandings)
      setLoading(false)
    }

    fetchMatchesAndCalculate()
  }, [selectedTournament])

  const renderTable = (teams: TeamStanding[], title?: string) => (
    <div className="mb-8">
      {title && <h3 className="text-zinc-300 font-bold font-mono mb-3 bg-zinc-900 inline-block px-3 py-1 rounded border border-zinc-700">{title}</h3>}
      <div className="overflow-x-auto shadow-xl rounded-lg">
        <table className="w-full text-xs text-left text-zinc-300 font-mono min-w-max">
          <thead className="text-[10px] text-zinc-400 uppercase bg-zinc-900 border-b border-zinc-700">
            <tr>
              <th scope="col" className="px-2 py-1.5 text-center">#</th>
              <th scope="col" className="px-3 py-1.5">Equipo</th>
              <th scope="col" className="px-2 py-1.5 text-center" title="Puntos">PTS</th>
              <th scope="col" className="px-2 py-1.5 text-center" title="Partidos Jugados">PJ</th>
              <th scope="col" className="px-2 py-1.5 text-center" title="Partidos Ganados">PG</th>
              <th scope="col" className="px-2 py-1.5 text-center" title="Partidos Empatados">PE</th>
              <th scope="col" className="px-2 py-1.5 text-center" title="Partidos Perdidos">PP</th>
              <th scope="col" className="px-2 py-1.5 text-center" title="Goles a Favor">GF</th>
              <th scope="col" className="px-2 py-1.5 text-center" title="Goles en Contra">GC</th>
              <th scope="col" className="px-2 py-1.5 text-center" title="Diferencia de Gol">DIF</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((team, index) => (
              <tr key={team.team_id} className="bg-black border-b border-zinc-800 hover:bg-zinc-900 transition-colors">
                <td className="px-2 py-1.5 text-center font-bold text-zinc-500">{index + 1}</td>
                <td className="px-3 py-1.5 font-semibold text-zinc-100 whitespace-nowrap">
                  {team.team_name}
                </td>
                <td className="px-2 py-1.5 text-center font-bold text-white bg-zinc-900/50">{team.points}</td>
                <td className="px-2 py-1.5 text-center">{team.played}</td>
                <td className="px-2 py-1.5 text-center text-green-500/80">{team.won}</td>
                <td className="px-2 py-1.5 text-center text-zinc-500">{team.drawn}</td>
                <td className="px-2 py-1.5 text-center text-red-500/80">{team.lost}</td>
                <td className="px-2 py-1.5 text-center">{team.goalsFor}</td>
                <td className="px-2 py-1.5 text-center">{team.goalsAgainst}</td>
                <td className="px-2 py-1.5 text-center font-semibold">{team.goalDiff > 0 ? `+${team.goalDiff}` : team.goalDiff}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto p-4 mt-10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-zinc-100 text-lg font-bold uppercase tracking-wider">Tabla de Posiciones</h2>
      </div>

      {loading ? (
        <div className="text-center text-zinc-500 py-10 font-mono">Calculando posiciones...</div>
      ) : standings.length > 0 ? (
        zones && Object.keys(zones).length > 0 ? (
          // Renderizar Zonas Paralelas
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Object.keys(zones).sort().map(zoneName => {
              const zoneTeamIds = zones[zoneName]
              // Filtramos los equipos y re-ordenamos porque al filtrar se mantiene el orden de puntos
              const zoneTeams = standings.filter(t => zoneTeamIds.includes(t.team_id))
              return <div key={zoneName}>{renderTable(zoneTeams, `ZONA ${zoneName}`)}</div>
            })}
          </div>
        ) : (
          // Renderizar Tabla General Única
          renderTable(standings)
        )
      ) : selectedTournament ? (
        <div className="text-center text-zinc-500 py-10 font-mono">No hay partidos finalizados para este torneo.</div>
      ) : null}

      {/* Bracket de Playoffs (si aplica al torneo) */}
      <PlayoffBracket selectedTournament={selectedTournament} />
    </div>
  )
}
