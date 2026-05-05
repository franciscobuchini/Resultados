// ============================================================
// TOURNAMENT SYSTEM — Paso 4: Wildcards (mejores terceros)
// ============================================================

import type { Tiebreaker } from './tournamentTypes'
import type { TeamStanding, Standings } from './computeStandings'

// ------------------------------------------------------------
// TIPOS
// ------------------------------------------------------------

/** Un equipo wildcard con el grupo del que proviene */
export interface WildcardTeam extends TeamStanding {
  group: string  // "A", "B", "C"... — de qué grupo viene
}

// ------------------------------------------------------------
// HELPERS
// ------------------------------------------------------------

/**
 * Compara dos wildcards según los criterios de desempate.
 * Igual que en compute-standings pero entre equipos de grupos distintos
 * — por eso NO se usa head_to_head (no jugaron entre sí).
 */
const compareWildcards = (
  a: WildcardTeam,
  b: WildcardTeam,
  tiebreakers: Tiebreaker[]
): number => {
  for (const criterion of tiebreakers) {
    let diff = 0

    if (criterion === 'points') {
      diff = b.points - a.points
    } else if (criterion === 'goal_difference') {
      diff = b.goal_difference - a.goal_difference
    } else if (criterion === 'goals_scored') {
      diff = b.goals_for - a.goals_for
    }

    // head_to_head no aplica entre wildcards de grupos distintos — se ignora

    if (diff !== 0) return diff
  }

  return 0 // sin desempate posible — la API lo resolverá
}

// ------------------------------------------------------------
// FUNCIÓN PRINCIPAL
// ------------------------------------------------------------

/**
 * Calcula los mejores N equipos de una posición específica entre todos los grupos.
 * Ej: los 8 mejores terceros del Mundial 2026.
 *
 * @param standings       - Tabla de posiciones ya calculada (computeStandings)
 * @param fromPosition    - Posición a considerar (generalmente 3)
 * @param count           - Cuántos clasifican (ej: 8)
 * @param tiebreakers     - Criterios de desempate para comparar entre grupos
 *
 * @returns Array de WildcardTeam ordenado de mejor a peor, limitado a count
 */
export function computeWildcards(
  standings: Standings,
  fromPosition: number,
  count: number,
  tiebreakers: Tiebreaker[]
): WildcardTeam[] {
  const candidates: WildcardTeam[] = []

  // Tomar el equipo en la posición indicada de cada grupo
  for (const [group, table] of Object.entries(standings)) {
    const team = table[fromPosition - 1]  // fromPosition es 1-based

    if (!team) continue  // el grupo tiene menos equipos que fromPosition

    candidates.push({ ...team, group })
  }

  // Ordenar por tiebreakers
  candidates.sort((a, b) => compareWildcards(a, b, tiebreakers))

  // Devolver solo los mejores N
  return candidates.slice(0, count)
}