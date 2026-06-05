import type { TabConfig } from '../tabTypes'
import type { Match, Goal, Tiebreaker } from '../../functions/computeStandings'
import { computeStandings } from '../../functions/computeStandings'
import FixtureTable from '../../components/tables/FixtureTable'
import StandingsTable from '../../components/tables/StandingsTable'
import EmptyState from '../../components/ui/EmptyState'
import ChampionBanner from '../../components/ui/ChampionBanner'
import { useTime, toLocal } from '../../functions/time'
import { getMatchStatusLabel } from '../../functions/matchHelpers'

export const tabConfig: TabConfig = {
  id: 'tournament',
  label: 'Torneo',
  order: 1,
}

// ------------------------------------------------------------
// HELPERS
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

const DEFAULT_TIEBREAKERS: Tiebreaker[] = ['head_to_head_points', 'goal_diff', 'goals_scored']
const DEFAULT_POINTS = { win: 3, draw: 1, loss: 0 }

// ------------------------------------------------------------
// TIPOS
// ------------------------------------------------------------

interface TournamentSystem {
  points?: { win: number; draw: number; loss: number }
  standings_stages?: string[]
  tiebreakers?: { top_two?: Tiebreaker[]; best_third?: Tiebreaker[] }
  groups?: {
    qualify?: Record<string, { destination: string; color: string; label: string }>
  }
}

interface TorneoTabProps {
  tournament: {
    tournament_teams: Record<string, string[]> | null
    tournament_system: TournamentSystem | null
    tournament_winner_id: string | null
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
  const system = tournament.tournament_system

  // Nombres de equipos para computeStandings
  // Primero desde los partidos del torneo (home_name / away_name)
  const teamNames: Record<string, string> = {}
  matches.forEach(m => {
    if (m.home_id && m.home_name) teamNames[m.home_id] = m.home_name
    if (m.away_id && m.away_name) teamNames[m.away_id] = m.away_name
  })

  // Fallback: si algún equipo no tiene partidos todavía, usar la DB
  Object.values(teamLookup).forEach(t => {
    if (t.team_name && !teamNames[t.team_id]) teamNames[t.team_id] = t.team_name
  })

  // Grupos desde tournament_teams o derivados desde los partidos
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

  // Partidos de la fase de grupos — filtramos por standings_stages si existe
  const standingsStages = system?.standings_stages ?? null
  const leagueMatches = matches.filter(m => {
    if (!m.match_round || !isFinished(m.match_status)) return false
    if (standingsStages) {
      return standingsStages.some(stage => m.match_round!.includes(stage))
    }
    return isMatchday(m.match_round)
  })

  // Tabla de posiciones
  const standings = groupKeys.length > 0
    ? computeStandings(
      leagueMatches,
      groups,
      teamNames,
      system?.tiebreakers?.top_two ?? DEFAULT_TIEBREAKERS,
      system?.points ?? DEFAULT_POINTS
    )
    : {}

  // Rounds disponibles para el selector
  const allRounds = Array.from(new Set(matches.map(m => m.match_round).filter(Boolean))) as string[]
  const matchdayRounds = allRounds.filter(isMatchday).sort((a, b) => matchdayNumber(a) - matchdayNumber(b))
  const knockoutRounds = allRounds.filter(r => !isMatchday(r))
  const sortedRounds = [...matchdayRounds, ...knockoutRounds]
  const currentIndex = sortedRounds.indexOf(selectedRound ?? '')

  // Partidos del round seleccionado convertidos a hora local
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
    matchesByDate[dateKey].push({
      ...match,
      match_status_label: getMatchStatusLabel(match.match_status, match.match_date)
    })
  }

  const winner = tournament.tournament_winner_id
    ? teamLookup[tournament.tournament_winner_id]
    : null

  return (
    <div className="flex flex-col gap-8">
      {winner && (
        <ChampionBanner
          teamId={winner.team_id}
          teamName={winner.team_name}
          teamCrestUrl={winner.team_crest_url}
        />
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-y-10 lg:gap-8">
      {/* Partidos del round seleccionado */}
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

      {/* Tabla de posiciones */}
      <div className="order-2 lg:order-1">
        <div className="flex flex-col gap-8">
          {groupKeys.map(group => (
            <StandingsTable
              key={group}
              title={group}
              standings={standings[group] ?? []}
              teamLookup={teamLookup}
              tournamentSystem={system}
            />
          ))}
        </div>
        </div>
      </div>
    </div>
  )
}