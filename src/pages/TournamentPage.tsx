import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../functions/supabase'
import PageHeader from '../layout/PageHeader'
import { computeStandings } from '../../shared/tournament/computeStandings'
import type { TournamentSystem } from '../../shared/tournament/tournamentTypes'
import type { Match } from '../../shared/tournament/matchTypes'

// ------------------------------------------------------------
// TIPOS
// ------------------------------------------------------------

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
  tournament_banner_url: string | null
  tournament_teams: Record<string, string[]> | null
  tournament_system: TournamentSystem | null
}

// ------------------------------------------------------------
// HELPERS
// ------------------------------------------------------------

/** Determina si un partido está finalizado según el status de la API */
const isFinished = (status: string | null): boolean =>
  status === 'FT' || status === 'AET' || status === 'PEN'

/** Determina si un match_round es una fecha numérica */
const isMatchday = (round: string): boolean =>
  /^\d+$/.test(round.trim())

// ------------------------------------------------------------
// COMPONENTE
// ------------------------------------------------------------

export default function TournamentPage() {
  const { tournamentId } = useParams<{ tournamentId: string }>()
  const [loading, setLoading] = useState(true)
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [matches, setMatches] = useState<Match[]>([])
  const [teamLookup, setTeamLookup] = useState<Record<string, TeamInfo>>({})
  const [selectedRound, setSelectedRound] = useState<string | null>(null)

  useEffect(() => {
    if (!tournamentId) return

    const fetchData = async () => {
      setLoading(true)

      const { data: tournaments } = await supabase
        .from('tournaments')
        .select('tournament_id, tournament_name, tournament_crest_url, tournament_banner_url, tournament_teams, tournament_system')
        .eq('tournament_id', tournamentId)
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
        .eq('tournament_id', tournamentId)
        .order('match_date', { ascending: true })

      const fetchedMatches = (matchData || []) as Match[]
      setMatches(fetchedMatches)

      // Seleccionar la primera fecha disponible por defecto
      const firstRound = fetchedMatches
        .map(m => m.match_round)
        .filter(Boolean)
        .find(r => isMatchday(r!))
      setSelectedRound(firstRound ?? null)

      // Traer info de equipos
      const teamIds = Array.from(new Set([
        ...fetchedMatches.map(m => m.home_id),
        ...fetchedMatches.map(m => m.away_id)
      ])).filter(Boolean) as string[]

      if (teamIds.length > 0) {
        const { data: teams } = await supabase
          .from('teams')
          .select('team_id, team_name, team_shortname, team_crest_url')
          .in('team_id', teamIds)

        if (teams) {
          const lookup: Record<string, TeamInfo> = {}
          teams.forEach(t => { lookup[t.team_id] = t as TeamInfo })
          setTeamLookup(lookup)
        }
      }

      setLoading(false)
    }

    fetchData()
  }, [tournamentId])

  // ------------------------------------------------------------
  // ESTADOS DE CARGA Y ERROR
  // ------------------------------------------------------------

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-white/10 border-t-white rounded-full animate-spin" />
    </div>
  )

  if (!tournament) return (
    <div className="min-h-[60vh] flex items-center justify-center text-zinc-500 font-black uppercase tracking-widest">
      Torneo no encontrado
    </div>
  )

  // ------------------------------------------------------------
  // DATOS DERIVADOS
  // ------------------------------------------------------------

  const groups = tournament.tournament_teams ?? {}
  const groupKeys = Object.keys(groups).sort()
  const system = tournament.tournament_system

  // Nombres de equipos para computeStandings
  const teamNames: Record<string, string> = {}
  Object.values(teamLookup).forEach(t => {
    if (t.team_name) teamNames[t.team_id] = t.team_name
  })

  // Partidos de la fase de liga (fechas numéricas)
  const leagueMatches = matches.filter(m =>
    m.match_round !== null && isMatchday(m.match_round) && isFinished(m.match_status)
  )

  // Tabla de posiciones usando el sistema del torneo
  const standings = system
    ? computeStandings(
        leagueMatches,
        groups,
        teamNames,
        system.phases.find(p => p.type === 'league') as Parameters<typeof computeStandings>[3],
        system.tiebreakers
      )
    : {}

  // Rounds disponibles para el selector
  const allRounds = Array.from(new Set(matches.map(m => m.match_round).filter(Boolean))) as string[]
  const matchdayRounds = allRounds.filter(isMatchday).sort((a, b) => parseInt(a) - parseInt(b))
  const knockoutRounds = allRounds.filter(r => !isMatchday(r))
  const sortedRounds = [...matchdayRounds, ...knockoutRounds]

  // Partidos del round seleccionado agrupados por fecha
  const filteredMatches = matches.filter(m => m.match_round === selectedRound)
  const matchesByDate: Record<string, Match[]> = {}
  for (const m of filteredMatches) {
    if (!m.match_date) continue
    if (!matchesByDate[m.match_date]) matchesByDate[m.match_date] = []
    matchesByDate[m.match_date].push(m)
  }
  const sortedDates = Object.keys(matchesByDate).sort()

  // ------------------------------------------------------------
  // RENDER
  // ------------------------------------------------------------

  return (
    <>
      <PageHeader
        title={tournament.tournament_name}
        subtitle={`Sigue todos los detalles, resultados y posiciones de ${tournament.tournament_name} en tiempo real.`}
        tournament_banner_url={tournament.tournament_banner_url}
        logo={tournament.tournament_crest_url}
      />

      <div className="max-w-[1600px] mx-auto p-4 mt-8">

        {/* Selector de Rondas */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-16 border-l-4 border-white pl-6">
          <div className="flex items-center bg-neutral-950 p-1 rounded-xl border border-zinc-800 shrink-0 flex-wrap gap-1">
            {sortedRounds.map(round => (
              <button
                key={round}
                onClick={() => setSelectedRound(round)}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                  selectedRound === round
                    ? 'bg-white text-black shadow-lg shadow-white/10'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {isMatchday(round) ? `Fecha ${round}` : round}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">

          {/* Tabla de posiciones */}
          <div className="lg:col-span-6 space-y-12">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-6 gap-y-10">
              {groupKeys.map(group => {
                const groupStandings = standings[group] ?? []

                return (
                  <div key={group} className="space-y-4">
                    <div className="flex items-center gap-2 px-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_white]" />
                      <span className="text-zinc-100 font-black uppercase tracking-[0.2em] text-[10px]">
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
                          {groupStandings.map((team, idx) => {
                            const info = teamLookup[team.team_id]
                            return (
                              <tr key={team.team_id} className="hover:bg-zinc-900/30 transition-colors h-9">
                                <td className="p-2 text-center text-zinc-600 font-bold">{idx + 1}</td>
                                <td className="p-2 overflow-hidden">
                                  <div className="flex items-center gap-2 overflow-hidden">
                                    {info?.team_crest_url
                                      ? <img src={info.team_crest_url} className="w-3.5 h-3.5 object-contain flex-shrink-0" alt="" />
                                      : <div className="w-3.5 h-3.5 bg-zinc-800 rounded-full flex-shrink-0" />
                                    }
                                    <span className="text-zinc-100 font-bold truncate">
                                      {info?.team_name ?? team.team_name}
                                    </span>
                                  </div>
                                </td>
                                <td className="p-2 text-center font-black text-white bg-white/5">{team.points}</td>
                                <td className="p-2 text-center">{team.played}</td>
                                <td className="p-2 text-center font-bold text-zinc-500">
                                  {team.goal_difference > 0 ? `+${team.goal_difference}` : team.goal_difference}
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

          {/* Partidos del round seleccionado */}
          <div className="lg:col-span-6 space-y-10">
            {sortedDates.map(date => {
              const dayMatches = matchesByDate[date]
              const formattedDate = date.substring(8, 10) + '/' + date.substring(5, 7)
              const dayName = new Date(date + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long' })

              return (
                <div key={date} className="space-y-6">
                  <div className="flex items-center gap-4 px-2">
                    <span className="text-white font-black text-2xl uppercase tracking-tighter">{dayName}</span>
                    <span className="text-zinc-600 font-mono text-sm">{formattedDate}</span>
                    <div className="flex-1 h-[1px] bg-gradient-to-r from-zinc-800 to-transparent" />
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {dayMatches.map(match => (
                      <div key={match.match_id} className="bg-zinc-900/40 border border-zinc-800/50 p-4 rounded-2xl hover:bg-zinc-900 transition-all shadow-lg">
                        <div className="flex items-center justify-between gap-4">

                          {/* Local */}
                          <div className="flex-1 flex items-center justify-end gap-3 min-w-0">
                            <span className="text-sm font-bold text-white truncate">
                              {teamLookup[match.home_id!]?.team_name ?? match.home_name}
                            </span>
                            {teamLookup[match.home_id!]?.team_crest_url
                              ? <img src={teamLookup[match.home_id!].team_crest_url!} className="w-6 h-6 object-contain" alt="" />
                              : <div className="w-6 h-6 bg-zinc-800 rounded-full" />
                            }
                          </div>

                          {/* Marcador */}
                          <div className="flex flex-col items-center gap-1 px-4 py-2 bg-black/40 rounded-xl border border-white/5 min-w-[80px]">
                            <div className="flex items-center gap-2">
                              <span className={`text-xl font-black ${match.home_score !== null ? 'text-white' : 'text-zinc-700'}`}>
                                {match.home_score ?? '-'}
                              </span>
                              <span className="text-zinc-600 font-bold">:</span>
                              <span className={`text-xl font-black ${match.away_score !== null ? 'text-white' : 'text-zinc-700'}`}>
                                {match.away_score ?? '-'}
                              </span>
                            </div>
                            <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500 whitespace-nowrap">
                              {match.match_status}
                            </span>
                          </div>

                          {/* Visitante */}
                          <div className="flex-1 flex items-center gap-3 min-w-0">
                            {teamLookup[match.away_id!]?.team_crest_url
                              ? <img src={teamLookup[match.away_id!].team_crest_url!} className="w-6 h-6 object-contain" alt="" />
                              : <div className="w-6 h-6 bg-zinc-800 rounded-full" />
                            }
                            <span className="text-sm font-bold text-white truncate">
                              {teamLookup[match.away_id!]?.team_name ?? match.away_name}
                            </span>
                          </div>

                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

        </div>
      </div>
    </>
  )
}