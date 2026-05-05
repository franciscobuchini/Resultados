// ============================================================
// TOURNAMENT SYSTEM — Paso 5: Estructura del bracket eliminatorio
// ============================================================

import type { KnockoutPhase, BracketSlot, TeamRef } from './tournamentTypes'
import type { Standings, TeamStanding } from './computeStandings'
import type { WildcardTeam } from './computeWildcards'

// ------------------------------------------------------------
// TIPOS
// ------------------------------------------------------------

/** Estado posible de un cruce en el bracket */
export type SlotStatus =
  | 'pending'    // los equipos aún no están definidos (fase anterior no terminó)
  | 'scheduled'  // equipos definidos, partido no jugado
  | 'ongoing'    // partido en curso
  | 'finished'   // partido terminado, hay ganador

/** Un cruce del bracket con los equipos ya resueltos */
export interface ResolvedSlot {
  slot: number
  status: SlotStatus
  home: TeamStanding | null   // null si aún no está definido
  away: TeamStanding | null   // null si aún no está definido
  winner: TeamStanding | null // null si no hay ganador aún
}

/** El bracket completo de una fase knockout */
export interface ResolvedBracket {
  phase: KnockoutPhase
  slots: ResolvedSlot[]
}

// ------------------------------------------------------------
// HELPERS
// ------------------------------------------------------------

/**
 * Resuelve un TeamRef a un TeamStanding concreto.
 * Devuelve null si el equipo aún no está determinado.
 */
const resolveRef = (
  ref: TeamRef,
  standings: Standings,
  wildcards: WildcardTeam[],
  previousBrackets: ResolvedBracket[]
): TeamStanding | null => {

  if (ref.from === 'group_stage') {
    // Equipo que viene de una posición en un grupo
    const group = standings[ref.group]
    if (!group) return null
    return group[ref.pos - 1] ?? null  // pos es 1-based

  } else if (ref.from === 'wildcard') {
    // Equipo que viene de los mejores terceros cuyo grupo esté en la lista
    const match = wildcards.find((w) => ref.groups.includes(w.group))
    return match ?? null

  } else if (ref.from === 'slot') {
    // Equipo que viene del ganador/perdedor de un slot anterior
    const bracket = previousBrackets.find((b) => b.phase.id === ref.phase)
    if (!bracket) return null

    const slot = bracket.slots.find((s) => s.slot === ref.slot)
    if (!slot) return null

    if (ref.result === 'winner') return slot.winner
    if (ref.result === 'loser') {
      // El perdedor es el equipo que no es el ganador
      if (!slot.winner || !slot.home || !slot.away) return null
      return slot.winner.team_id === slot.home.team_id ? slot.away : slot.home
    }

  } else if (ref.from === 'league') {
    // Equipo que viene de una posición en la tabla de liga
    // La liga tiene una sola clave en standings
    const tables = Object.values(standings)
    if (tables.length === 0) return null
    const table = tables[0]  // liga = una sola tabla
    return table[ref.pos - 1] ?? null
  }

  return null
}

/**
 * Determina el estado de un cruce basándose en los partidos ya jugados.
 * match_status viene de la API: "NS" (not started), "1H", "2H", "FT", etc.
 */
const resolveStatus = (
  matchStatus: string | null | undefined
): SlotStatus => {
  if (!matchStatus || matchStatus === 'NS') return 'scheduled'
  if (matchStatus === 'FT' || matchStatus === 'AET' || matchStatus === 'PEN') return 'finished'
  return 'ongoing'
}

// ------------------------------------------------------------
// FUNCIÓN PRINCIPAL
// ------------------------------------------------------------

/**
 * Resuelve el bracket de una fase knockout — asigna equipos reales a cada slot.
 *
 * @param phase            - La KnockoutPhase del tournament_system
 * @param standings        - Tabla de posiciones de la fase de liga (computeStandings)
 * @param wildcards        - Mejores terceros (computeWildcards) — array vacío si no hay
 * @param previousBrackets - Brackets ya resueltos de fases anteriores
 * @param matchStatuses    - Estado actual de cada partido { slot → match_status }
 * @param matchWinners     - Ganadores confirmados por la API { slot → team_id }
 *
 * @returns ResolvedBracket con cada slot resuelto al máximo posible
 */
export function resolveBracket(
  phase: KnockoutPhase,
  standings: Standings,
  wildcards: WildcardTeam[],
  previousBrackets: ResolvedBracket[],
  matchStatuses: Record<number, string>,  // slot → match_status
  matchWinners: Record<number, string>    // slot → team_id del ganador
): ResolvedBracket {
  const slots: ResolvedSlot[] = phase.bracket.map((bracketSlot: BracketSlot) => {
    const home = resolveRef(bracketSlot.home, standings, wildcards, previousBrackets)
    const away = resolveRef(bracketSlot.away, standings, wildcards, previousBrackets)

    const status: SlotStatus =
      home === null || away === null
        ? 'pending'
        : resolveStatus(matchStatuses[bracketSlot.slot])

    // El ganador viene de la API (match_winner o comparando scores)
    // Si no hay ganador confirmado todavía, es null
    const winnerId = matchWinners[bracketSlot.slot]
    const winner =
      winnerId && home && away
        ? home.team_id === winnerId
          ? home
          : away
        : null

    return {
      slot: bracketSlot.slot,
      status,
      home,
      away,
      winner,
    }
  })

  return { phase, slots }
}