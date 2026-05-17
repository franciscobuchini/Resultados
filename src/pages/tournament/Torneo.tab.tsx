import type { TabConfig } from '../tabTypes'
import type { Match, Goal } from '../../../shared/tournament/matchTypes'
import type { TournamentSystem, LeaguePhase, Tiebreaker } from '../../../shared/tournament/tournamentTypes'
import { computeStandings } from '../../../shared/tournament/computeStandings'
import FixtureTable from '../../components/tables/FixtureTable'
import StandingsTable from '../../components/tables/StandingsTable'
import EmptyState from '../../components/ui/EmptyState'
import { useTime, toLocal } from '../../functions/time'
import { getMatchStatusLabel } from '../../functions/matchHelpers'

export const tabConfig: TabConfig = {
  id: 'tournament',
  label: 'Torneo',
  order: 1,
}

// ------------------------------------------------------------
// HELPERS (copiados del antiguo TournamentPage)
// ------------------------------------------------------------

const isFinished = (status: string | null): boolean => {
  if (!status) return false
  const s = status.toLowerCase().trim()
  return ['ft', 'aet', 'pen', 'finalizado'].includes(s)
}

const isMatchday = (round: string): boolean =>
  /^\d+$/.test(round.trim()) || /^fecha\s+\d+$/i.test(round.trim())

const matchdayNumber = (round: string): number => {
  const pure = round.trim().match(/^(\d+)$/)
  if (pure) return parseInt(pure[1])
  const fechaN = round.trim().match(/^fecha\s+(\d+)$/i)
  if (fechaN) return parseInt(fechaN[1])
  return Infinity
}

const DEFAULT_TIEBREAKERS: Tiebreaker[] = ['points', 'goal_difference', 'goals_scored']
const DEFAULT_LEAGUE_PHASE: LeaguePhase = {
  id: 'default',
  type: 'league',
}

// ------------------------------------------------------------
// PROPS
// ------------------------------------------------------------

interface TorneoTabProps {
  tournament: {
    tournament_teams: Record<string, string[]> | null
    tournament_system: TournamentSystem | null
  }
  matches: Match[]
  goals: Goal[]
  teamLookup: Record<string, { team_id: string; team_name: string; team_shortname: string | null; team_crest_url: string | null }>
  selectedRound: string | null
  setSelectedRound: (round: string | null) => void
}

// ------------------------------------------------------------
// COMPONENTE
// ------------------------------------------------------------

export default function TorneoTab({
  tournament, matches, goals, teamLookup, selectedRound, setSelectedRound
}: TorneoTabProps) {
  const { utcOffset } = useTime()

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
    const allTeamIds = Array.from(new Set([
      ...matches.map(m => m.home_id),
      ...matches.map(m => m.away_id)
    ])).filter(Boolean) as string[]
    return allTeamIds.length > 0 ? { 'Torneo': allTeamIds } : {}
  })()
  const groupKeys = Object.keys(groups).sort()

  // Partidos de la fase de liga
  const leagueMatches = matches.filter(m =>
    m.match_round !== null && isMatchday(m.match_round) && isFinished(m.match_status)
  )

  // Tabla de posiciones
  const system = tournament.tournament_system
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

  // Partidos del round seleccionado, convertidos a hora local
  const filteredMatches = matches.filter(m => m.match_round === selectedRound)
  const localizedMatches = filteredMatches.map(m => ({
    match: m,
    local: toLocal(m.match_date, m.match_time_utc, utcOffset),
  }))
  localizedMatches.sort((a, b) => a.local.timestamp - b.local.timestamp)

  // Agrupar por fecha local
  const matchesByDate: Record<string, Match[]> = {}
  for (const { match, local } of localizedMatches) {
    const dateKey = local.date || 'TBD'
    if (!matchesByDate[dateKey]) matchesByDate[dateKey] = []
    const matchWithLabel: Match = {
      ...match,
      match_status_label: getMatchStatusLabel(match.match_status, match.match_date)
    }
    matchesByDate[dateKey].push(matchWithLabel)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-y-10 lg:gap-8">
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
  )
}
