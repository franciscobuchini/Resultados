import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../functions/supabase'
import PageBanner from '../layout/PageBanner'
import PageContent from '../layout/PageContent'
import StandingsTable from '../components/tables/StandingsTable'
import FixtureTable from '../components/tables/FixtureTable'
import Error404 from './Error404'
import { computeStandings } from '../../shared/tournament/computeStandings'
import type { TournamentSystem, LeaguePhase, Tiebreaker } from '../../shared/tournament/tournamentTypes'
import type { Match, Goal } from '../../shared/tournament/matchTypes'
import { useTime, toLocal } from '../functions/time'
import { useTheme } from '../functions/themeStore'
import { getMatchStatusLabel } from '../functions/matchHelpers'
import EmptyState from '../components/ui/EmptyState'
import LoadingState from '../components/ui/LoadingState'
import PageHeader from '../layout/PageHeader'
import { useNavigate } from 'react-router-dom'

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

/** Determina si un partido está finalizado según el status */
const isFinished = (status: string | null): boolean => {
  if (!status) return false
  const s = status.toLowerCase().trim()
  return ['ft', 'aet', 'pen', 'finalizado'].includes(s)
}

/** Determina si un match_round es una fecha de liga (numérica o "Fecha X") */
const isMatchday = (round: string): boolean =>
  /^\d+$/.test(round.trim()) || /^fecha\s+\d+$/i.test(round.trim())

/** Extrae el número de fecha de un match_round para ordenar */
const matchdayNumber = (round: string): number => {
  const pure = round.trim().match(/^(\d+)$/)
  if (pure) return parseInt(pure[1])
  const fechaN = round.trim().match(/^fecha\s+(\d+)$/i)
  if (fechaN) return parseInt(fechaN[1])
  return Infinity
}

/** Tiebreakers estándar por defecto (puntos → dif. goles → goles a favor) */
const DEFAULT_TIEBREAKERS: Tiebreaker[] = ['points', 'goal_difference', 'goals_scored']

/** Fase de liga por defecto cuando no hay tournament_system */
const DEFAULT_LEAGUE_PHASE: LeaguePhase = {
  id: 'default',
  type: 'league',
}

// ------------------------------------------------------------
// COMPONENTE
// ------------------------------------------------------------

export default function TournamentPage() {
  const { tournamentId } = useParams<{ tournamentId: string }>()
  const [loading, setLoading] = useState(true)
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [matches, setMatches] = useState<Match[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [teamLookup, setTeamLookup] = useState<Record<string, TeamInfo>>({})
  const [selectedRound, setSelectedRound] = useState<string | null>(null)
  const { utcOffset } = useTime();
  const setLastTournamentId = useTheme(state => state.setLastTournamentId);
  const [activeTab, setActiveTab] = useState('general')
  const [historyTournaments, setHistoryTournaments] = useState<{ tournament_id: string; tournament_name: string }[]>([])
  const navigate = useNavigate()

  useEffect(() => {
    if (!tournamentId) return
    setLastTournamentId(tournamentId);

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

      // Buscar ediciones históricas
      const tId = tourney.tournament_id.trim()
      const prefix = tId.substring(0, 3)
      const penultimate = tId.charAt(tId.length - 2)
      
      // Consultar torneos que empiecen con el mismo prefijo
      const { data: history } = await supabase
        .from('tournaments')
        .select('tournament_id, tournament_name')
        .ilike('tournament_id', `${prefix}.%`)
      
      if (history) {
        const filtered = history.filter(t => {
          const otherId = t.tournament_id.trim()
          if (otherId.length < 4) return false
          const otherPenultimate = otherId.charAt(otherId.length - 2)
          return otherPenultimate === penultimate && otherId !== tId
        }).sort((a, b) => b.tournament_id.localeCompare(a.tournament_id))
        
        setHistoryTournaments(filtered)
      }

      const { data: matchData } = await supabase
        .from('matches')
        .select('*')
        .eq('tournament_id', tournamentId)
        .order('match_date', { ascending: true })
        .order('match_time_utc', { ascending: true })

      const fetchedMatches = (matchData || []) as Match[]
      setMatches(fetchedMatches)

      // Traer goles de estos partidos
      const matchIds = fetchedMatches.map(m => m.match_id)
      if (matchIds.length > 0) {
        const { data: goalData } = await supabase
          .from('goals')
          .select('*')
          .in('match_id', matchIds)
          .order('goal_minute', { ascending: true })

        if (goalData) {
          setGoals(goalData as Goal[])
        }
      }

      // Seleccionar la primera fecha disponible por defecto (numérica si existe, si no la primera que haya)
      const rounds = Array.from(new Set(fetchedMatches.map(m => m.match_round).filter(Boolean))) as string[]
      const firstMatchday = rounds.filter(isMatchday).sort((a, b) => matchdayNumber(a) - matchdayNumber(b))[0]
      setSelectedRound(firstMatchday ?? rounds[0] ?? null)

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

  if (loading) return <LoadingState fullHeight />

  if (!tournament) return <Error404 />

  // ------------------------------------------------------------
  // DATOS DERIVADOS
  // ------------------------------------------------------------

  const system = tournament.tournament_system

  // Nombres de equipos para computeStandings
  const teamNames: Record<string, string> = {}
  Object.values(teamLookup).forEach(t => {
    if (t.team_name) teamNames[t.team_id] = t.team_name
  })

  // Si no hay tournament_teams, derivar un grupo único desde los partidos
  const groups: Record<string, string[]> = (() => {
    if (tournament.tournament_teams && Object.keys(tournament.tournament_teams).length > 0) {
      return tournament.tournament_teams
    }
    // Fallback: todos los equipos en un solo grupo
    const allTeamIds = Array.from(new Set([
      ...matches.map(m => m.home_id),
      ...matches.map(m => m.away_id)
    ])).filter(Boolean) as string[]
    return allTeamIds.length > 0 ? { 'General': allTeamIds } : {}
  })()
  const groupKeys = Object.keys(groups).sort()

  // Partidos de la fase de liga (fechas numéricas o "Fecha X")
  const leagueMatches = matches.filter(m =>
    m.match_round !== null && isMatchday(m.match_round) && isFinished(m.match_status)
  )

  // Tabla de posiciones — usa el sistema del torneo si existe, si no valores por defecto
  const leaguePhase = system?.phases.find(p => p.type === 'league') as LeaguePhase | undefined
  const standings = groupKeys.length > 0
    ? computeStandings(
      leagueMatches,
      groups,
      teamNames,
      leaguePhase ?? DEFAULT_LEAGUE_PHASE,
      system?.tiebreakers ?? DEFAULT_TIEBREAKERS
    )
    : {}

  // Rounds disponibles para el selector
  const allRounds = Array.from(new Set(matches.map(m => m.match_round).filter(Boolean))) as string[]
  const matchdayRounds = allRounds.filter(isMatchday).sort((a, b) => matchdayNumber(a) - matchdayNumber(b))
  const knockoutRounds = allRounds.filter(r => !isMatchday(r))
  const sortedRounds = [...matchdayRounds, ...knockoutRounds]
  const currentIndex = sortedRounds.indexOf(selectedRound ?? '')


  // Partidos del round seleccionado, convertidos a hora local y ordenados cronológicamente
  const filteredMatches = matches.filter(m => m.match_round === selectedRound);

  const localizedMatches = filteredMatches.map(m => ({
    match: m,
    local: toLocal(m.match_date, m.match_time_utc, utcOffset),
  }));

  // Ordenar por timestamp local
  localizedMatches.sort((a, b) => a.local.timestamp - b.local.timestamp);

  // Agrupar por fecha local
  const matchesByDate: Record<string, Match[]> = {};
  for (const { match, local } of localizedMatches) {
    const dateKey = local.date || 'TBD';
    if (!matchesByDate[dateKey]) matchesByDate[dateKey] = [];

    // Inyectamos el label de estado para partidos de hoy
    const matchWithLabel: Match = {
      ...match,
      match_status_label: getMatchStatusLabel(match.match_status, match.match_date)
    };

    matchesByDate[dateKey].push(matchWithLabel);
  }

  // ------------------------------------------------------------
  // RENDER
  // ------------------------------------------------------------

  const tournamentTabs = [
    { id: 'general', label: 'General' },
    { id: 'fixtures', label: 'Partidos', disabled: true },
    { id: 'standings', label: 'Posiciones', disabled: true },
    { id: 'history', label: 'Historial' },
    { id: 'stats', label: 'Estadísticas', disabled: true },
  ]

  return (
    <>
      <PageBanner
        title={tournament.tournament_name}
        tournament_banner_url={tournament.tournament_banner_url}
        logo={tournament.tournament_crest_url}
      >
        <PageHeader 
          tabs={tournamentTabs} 
          activeTabId={activeTab} 
          onChange={setActiveTab}
        />
      </PageBanner>

      <PageContent maxWidth="1600">
        {activeTab === 'general' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Partidos del round seleccionado (Primero en mobile) */}
            <div className="flex flex-col gap-4 order-1 lg:order-2">
              {selectedRound ? (
                <FixtureTable
                  roundName={isMatchday(selectedRound) ? `${selectedRound}` : selectedRound}
                  matchesByDate={matchesByDate}
                  goals={goals}
                  teamLookup={teamLookup}
                  onPrevRound={currentIndex > 0 ? () => setSelectedRound(sortedRounds[currentIndex - 1]) : undefined}
                  onNextRound={currentIndex < sortedRounds.length - 1 ? () => setSelectedRound(sortedRounds[currentIndex + 1]) : undefined}
                />
              ) : (
                <EmptyState message="No hay partidos programados" className="h-64" />
              )}
            </div>

            {/* Tabla de posiciones (Segundo en mobile) */}
            <div className="order-2 lg:order-1">
              <div className="flex flex-col gap-8">
                {groupKeys.map(group => (
                  <StandingsTable
                    key={group}
                    title={group}
                    standings={standings[group] ?? []}
                    teamLookup={teamLookup}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="flex flex-col gap-4">
            <h3 className={`text-2xl font-bold mb-4`}>Ediciones Anteriores</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {historyTournaments.map(t => (
                <button
                  key={t.tournament_id}
                  onClick={() => {
                    navigate(`/tournament/${t.tournament_id}`)
                    setActiveTab('general')
                  }}
                  className={`flex items-center justify-between p-4 rounded-xl border bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/50 transition-all text-left`}
                >
                  <span className="font-medium">{t.tournament_name}</span>
                  <span className="text-xs text-zinc-500 font-mono">{t.tournament_id}</span>
                </button>
              ))}
              {historyTournaments.length === 0 && (
                <EmptyState message="No se encontraron otras ediciones de este torneo" />
              )}
            </div>
          </div>
        )}
      </PageContent>
    </>
  )
}