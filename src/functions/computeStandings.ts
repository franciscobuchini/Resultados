// ============================================================
// Match & Goal — tipos que reflejan la tabla matches de Supabase
// ============================================================

export interface Match {
  match_id: string
  match_date: string | null
  match_time_utc: string | null
  match_status: string | null
  match_status_label?: string | React.ReactNode | null
  match_round: string | null
  home_id: string | null
  home_name: string | null
  home_score: number | null
  home_penalty: number | null
  away_id: string | null
  away_name: string | null
  away_score: number | null
  away_penalty: number | null
  tournament_id: string | null
  match_notes?: string | null
}

export interface Goal {
  goal_id: string
  match_id: string
  team_id: string
  goal_minute: number | null
  player_name: string
  goal_type: string // 'G' = normal, 'P' = penalty, 'C' = own goal
}

// ============================================================
// TeamStanding — fila de la tabla de posiciones
// ============================================================

export interface TeamStanding {
  team_id: string
  team_name: string
  played: number
  won: number
  drawn: number
  lost: number
  goals_for: number
  goals_against: number
  goal_difference: number
  points: number
}

export type Standings = Record<string, TeamStanding[]>

// ============================================================
// Tiebreaker — criterios de desempate
// ============================================================

export type Tiebreaker =
  | 'head_to_head_points'
  | 'goal_diff'
  | 'goals_scored'

// ============================================================
// HELPERS
// ============================================================

export interface TournamentSystem {
  points?: { win: number; draw: number; loss: number }
  standings_stages?: string[]
  tiebreakers?: { top_two?: Tiebreaker[]; best_third?: Tiebreaker[] }
  groups?: {
    qualify?: Record<string, { destination: string; color: string; label: string }>
  }
  knockout?: {
    away_goals?: boolean
    third_place_match?: boolean
    legs?: Record<string, number>
  }
}

const createStanding = (team_id: string, team_name: string): TeamStanding => ({
  team_id,
  team_name,
  played: 0,
  won: 0,
  drawn: 0,
  lost: 0,
  goals_for: 0,
  goals_against: 0,
  goal_difference: 0,
  points: 0,
})

const applyMatch = (
  home: TeamStanding,
  away: TeamStanding,
  homeScore: number,
  awayScore: number,
  pointsWin: number,
  pointsDraw: number,
): void => {
  home.played++
  away.played++
  home.goals_for += homeScore
  home.goals_against += awayScore
  away.goals_for += awayScore
  away.goals_against += homeScore
  home.goal_difference = home.goals_for - home.goals_against
  away.goal_difference = away.goals_for - away.goals_against

  if (homeScore > awayScore) {
    home.won++
    home.points += pointsWin
    away.lost++
  } else if (homeScore < awayScore) {
    away.won++
    away.points += pointsWin
    home.lost++
  } else {
    home.drawn++
    home.points += pointsDraw
    away.drawn++
    away.points += pointsDraw
  }
}

const compareByTiebreakers = (
  a: TeamStanding,
  b: TeamStanding,
  tiebreakers: Tiebreaker[],
  allMatches: Match[]
): number => {
  for (const criterion of tiebreakers) {
    let diff = 0

    if (criterion === 'head_to_head_points') {
      const h2h = allMatches.filter(
        m =>
          (m.home_id === a.team_id && m.away_id === b.team_id) ||
          (m.home_id === b.team_id && m.away_id === a.team_id)
      )
      let aPoints = 0, bPoints = 0
      for (const m of h2h) {
        if (m.home_score === null || m.away_score === null) continue
        const aIsHome = m.home_id === a.team_id
        const aScore = aIsHome ? m.home_score : m.away_score
        const bScore = aIsHome ? m.away_score : m.home_score
        if (aScore > bScore) aPoints += 3
        else if (aScore < bScore) bPoints += 3
        else { aPoints++; bPoints++ }
      }
      diff = bPoints - aPoints

    } else if (criterion === 'goal_diff') {
      diff = b.goal_difference - a.goal_difference

    } else if (criterion === 'goals_scored') {
      diff = b.goals_for - a.goals_for
    }

    if (diff !== 0) return diff
  }
  return 0
}

// ============================================================
// FUNCIÓN PRINCIPAL
// ============================================================

/**
 * Calcula la tabla de posiciones a partir de los partidos y grupos del torneo.
 *
 * @param matches         - Partidos finalizados de la fase de grupos
 * @param groups          - tournament_teams: { "A": ["INT001", ...], ... }
 * @param teamNames       - team_id → team_name
 * @param tiebreakers     - tournament_system.tiebreakers.top_two
 * @param points          - tournament_system.points
 */
export function computeStandings(
  matches: Match[],
  groups: Record<string, string[]>,
  teamNames: Record<string, string>,
  tiebreakers: Tiebreaker[],
  points: { win: number; draw: number; loss: number }
): Standings {
  const standings: Standings = {}

  // Inicializar tabla vacía por grupo
  for (const [group, teamIds] of Object.entries(groups)) {
    standings[group] = teamIds.map(id => createStanding(id, teamNames[id] ?? id))
  }

  // Procesar partidos
  for (const match of matches) {
    if (
      match.home_id === null ||
      match.away_id === null ||
      match.home_score === null ||
      match.away_score === null
    ) continue

    for (const group of Object.keys(standings)) {
      const homeRow = standings[group].find(t => t.team_id === match.home_id)
      const awayRow = standings[group].find(t => t.team_id === match.away_id)
      if (homeRow && awayRow) {
        applyMatch(homeRow, awayRow, match.home_score, match.away_score, points.win, points.draw)
        break
      }
    }
  }

  // Ordenar por puntos → tiebreakers
  for (const group of Object.keys(standings)) {
    standings[group].sort((a, b) => {
      const pointsDiff = b.points - a.points
      if (pointsDiff !== 0) return pointsDiff
      return compareByTiebreakers(a, b, tiebreakers, matches)
    })
  }

  return standings
}