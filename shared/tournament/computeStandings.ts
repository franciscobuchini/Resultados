// ============================================================
// TOURNAMENT SYSTEM — Paso 3: Tabla de posiciones
// ============================================================

import type { Tiebreaker, LeaguePhase } from './tournamentTypes'
import type { Match } from './matchTypes'

// ------------------------------------------------------------
// TIPOS
// ------------------------------------------------------------

/** Fila de la tabla de posiciones de un equipo */
export interface TeamStanding {
  team_id: string
  team_name: string
  played: number       // partidos jugados
  won: number          // ganados
  drawn: number        // empatados
  lost: number         // perdidos
  goals_for: number    // goles a favor
  goals_against: number // goles en contra
  goal_difference: number // diferencia de goles
  points: number       // puntos
}

/**
 * Resultado de computeStandings.
 * La clave es el nombre del grupo ("A", "B", "Zona A"...)
 * Si el torneo es una liga con un solo grupo, la clave es esa única clave.
 */
export type Standings = Record<string, TeamStanding[]>

// ------------------------------------------------------------
// HELPERS
// ------------------------------------------------------------

/** Crea una fila vacía para un equipo */
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

/** Aplica el resultado de un partido a las filas de los dos equipos */
const applyMatch = (
  home: TeamStanding,
  away: TeamStanding,
  homeScore: number,
  awayScore: number
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
    home.points += 3
    away.lost++
  } else if (homeScore < awayScore) {
    away.won++
    away.points += 3
    home.lost++
  } else {
    home.drawn++
    home.points++
    away.drawn++
    away.points++
  }
}

/**
 * Compara dos equipos según los criterios de desempate en orden.
 * Devuelve negativo si a va antes, positivo si b va antes.
 *
 * head_to_head requiere los partidos entre ambos equipos —
 * se calculan al momento de comparar.
 */
const compareByTiebreakers = (
  a: TeamStanding,
  b: TeamStanding,
  tiebreakers: Tiebreaker[],
  allMatches: Match[]
): number => {
  for (const criterion of tiebreakers) {
    let diff = 0

    if (criterion === 'points') {
      diff = b.points - a.points

    } else if (criterion === 'goal_difference') {
      diff = b.goal_difference - a.goal_difference

    } else if (criterion === 'goals_scored') {
      diff = b.goals_for - a.goals_for

    } else if (
      criterion === 'head_to_head_points' ||
      criterion === 'head_to_head_goal_difference' ||
      criterion === 'head_to_head_goals_scored'
    ) {
      // Filtrar solo los partidos entre a y b
      const h2h = allMatches.filter(
        (m) =>
          (m.home_id === a.team_id && m.away_id === b.team_id) ||
          (m.home_id === b.team_id && m.away_id === a.team_id)
      )

      let aPoints = 0, bPoints = 0
      let aGoals = 0, bGoals = 0

      for (const m of h2h) {
        if (m.home_score === null || m.away_score === null) continue
        const aIsHome = m.home_id === a.team_id
        const aScore = aIsHome ? m.home_score : m.away_score
        const bScore = aIsHome ? m.away_score : m.home_score
        aGoals += aScore
        bGoals += bScore
        if (aScore > bScore) aPoints += 3
        else if (aScore < bScore) bPoints += 3
        else { aPoints++; bPoints++ }
      }

      if (criterion === 'head_to_head_points') diff = bPoints - aPoints
      else if (criterion === 'head_to_head_goal_difference') diff = (aGoals - bGoals) - (bGoals - aGoals)
      else if (criterion === 'head_to_head_goals_scored') diff = bGoals - aGoals
    }

    if (diff !== 0) return diff
  }

  return 0 // sin desempate posible — la API lo resolverá
}

// ------------------------------------------------------------
// FUNCIÓN PRINCIPAL
// ------------------------------------------------------------

/**
 * Calcula la tabla de posiciones de la fase de liga de un torneo.
 *
 * @param matches         - Partidos de la fase de liga ya filtrados desde Supabase
 * @param tournamentTeams - Columna tournament_teams del torneo
 *                          { "A": ["INT001", ...], "B": [...] } → grupos
 *                          { "Liga": ["ARG001", ...] }          → liga
 * @param phase           - La LeaguePhase del tournament_system
 * @param globalTiebreakers - tiebreakers globales del TournamentSystem
 *
 * @returns Standings — tabla por grupo o tabla única si es liga
 */
export function computeStandings(
  matches: Match[],
  tournamentTeams: Record<string, string[]>,
  teamNames: Record<string, string>, // team_id → team_name
  phase: LeaguePhase,
  globalTiebreakers: Tiebreaker[]
): Standings {
  // Los tiebreakers de la fase tienen prioridad sobre los globales
  const tiebreakers = phase.tiebreakers ?? globalTiebreakers

  const standings: Standings = {}

  // Inicializar tabla vacía para cada grupo con sus equipos
  for (const [group, teamIds] of Object.entries(tournamentTeams)) {
    standings[group] = teamIds.map((id) =>
      createStanding(id, teamNames[id] ?? id)
    )
  }

  // Procesar cada partido
  for (const match of matches) {
    if (
      match.home_id === null ||
      match.away_id === null ||
      match.home_score === null ||
      match.away_score === null
    ) {
      continue // partido no jugado aún
    }

    // Encontrar en qué grupo están los equipos
    for (const group of Object.keys(standings)) {
      const homeRow = standings[group].find((t) => t.team_id === match.home_id)
      const awayRow = standings[group].find((t) => t.team_id === match.away_id)

      // Solo procesamos si ambos equipos están en el mismo grupo
      // (cubre el caso de cruces entre zonas en la liga argentina)
      if (homeRow && awayRow) {
        applyMatch(homeRow, awayRow, match.home_score, match.away_score)
        break
      }
    }
  }

  // Ordenar cada grupo por tiebreakers
  for (const group of Object.keys(standings)) {
    standings[group].sort((a, b) =>
      compareByTiebreakers(a, b, tiebreakers, matches)
    )
  }

  return standings
}