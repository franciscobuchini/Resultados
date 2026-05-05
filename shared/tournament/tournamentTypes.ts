// ============================================================
// TOURNAMENT SYSTEM — Type Definitions
// Paso 1: Schema TypeScript
// ============================================================

// ------------------------------------------------------------
// ENUMS / LITERALES
// ------------------------------------------------------------

/** Tipo general del torneo */
export type TournamentType =
  | 'league'           // liga regular — ej: Liga Argentina, Premier League
  | 'league_knockout'  // grupos + eliminatoria — ej: Mundial, Champions, Copa América
  | 'knockout'         // eliminatoria pura — ej: Copa Argentina, desempate a partido único

/** Tipos de fase dentro de un torneo */
export type PhaseType =
  | 'league'    // tabla de puntos — si tournament_teams tiene claves ({ A: [], B: [] }) hay grupos separados, si es lista plana hay una sola tabla
  | 'knockout'  // eliminatoria (partido único o ida y vuelta)

/** Criterios de desempate disponibles.
 * El orden en el array del torneo define la prioridad.
 * fair_play y drawing no se calculan — si se llega a esa instancia
 * la API confirma el clasificado mostrando el próximo partido.
 */
export type Tiebreaker =
  | 'points'                       // puntos
  | 'head_to_head_points'          // puntos en enfrentamientos directos
  | 'head_to_head_goal_difference' // diferencia de goles en enfrentamientos directos
  | 'head_to_head_goals_scored'    // goles marcados en enfrentamientos directos
  | 'goal_difference'              // diferencia de goles general
  | 'goals_scored'                 // goles marcados general

// ------------------------------------------------------------
// REFERENCIAS — de dónde viene un equipo en el bracket
// ------------------------------------------------------------

/** Un equipo que viene de una posición en un grupo */
interface RefFromGroup {
  from: 'group_stage'
  group: string   // "A", "B", "C"...
  pos: number     // 1 = primero, 2 = segundo, etc.
}

/** Un equipo que viene de los wildcards (mejores terceros, etc.) */
interface RefFromWildcard {
  from: 'wildcard'
  groups: string[]  // grupos válidos de donde puede venir el wildcard — ej: ["A","B","C"]
                    // el sistema toma el mejor clasificado cuyo grupo esté en esta lista
}

/** Un equipo que viene del ganador/perdedor de otro slot del bracket */
interface RefFromSlot {
  from: 'slot'
  phase: string        // id de la fase anterior — ej: "Octavos de final"
  slot: number         // número de slot
  result: 'winner' | 'loser'
}

/** Un equipo que viene de una posición en la tabla de una liga */
interface RefFromLeague {
  from: 'league'
  phase: string   // id de la fase — ej: "regular_season"
  pos: number
}

export type TeamRef = RefFromGroup | RefFromWildcard | RefFromSlot | RefFromLeague

// ------------------------------------------------------------
// ADVANCEMENT — reglas de clasificación por fase
// ------------------------------------------------------------

/** Wildcards: los mejores N equipos de una posición entre todos los grupos */
interface WildcardAdvancement {
  from_position: number      // de qué posición se toman (generalmente 3)
  count: number              // cuántos clasifican (ej: 8 mejores terceros)
  tiebreakers: Tiebreaker[] // criterios para comparar terceros ENTRE grupos
}

/** Clasificaciones externas a otros torneos (estructura, sin lógica por ahora) */
interface ExternalAdvancement {
  tournament_key: string  // referencia al torneo destino
  positions: number[]     // qué posiciones clasifican
}

/** Reglas de ascenso/descenso para ligas */
interface RelegationAdvancement {
  from_bottom: number   // los últimos N descienden
}

/**
 * Playoff de desempate — se activa cuando varios equipos
 * terminan con los mismos puntos en posiciones clave.
 * Ej: cuadrangular por el campeonato, desempate a partido único.
 */
interface TiebreakerPlayoff {
  format: 'single_match' | 'league'  // partido único o todos contra todos
  positions: number[]                 // qué posiciones pueden activarlo
}

/**
 * Reglas de clasificación — cubre tanto ligas como grupos.
 * Para fase de grupos: usar per_group y wildcard.
 * Para liga regular: usar champion, relegation, tiebreaker_playoff.
 */
interface LeagueAdvancement {
  // --- para fase de grupos (tournament_teams con claves A, B, C...) ---
  per_group?: { automatic: number }   // top N de cada grupo clasifican directamente
  wildcard?: WildcardAdvancement      // mejores N equipos de una posición entre grupos

  // --- para liga regular (tournament_teams lista plana) ---
  champion?: { positions: number[] }      // null en liguillas sin campeón
  relegation?: RelegationAdvancement      // null si no hay descenso
  tiebreaker_playoff?: TiebreakerPlayoff  // desempate si hay igualdad de puntos
  external?: ExternalAdvancement[]        // clasificaciones a torneos externos (sin lógica por ahora)
}

// ------------------------------------------------------------
// FASES
// ------------------------------------------------------------

/** Un cruce en el bracket eliminatorio */
export interface BracketSlot {
  slot: number  // número identificador del cruce
  home: TeamRef
  away: TeamRef
}

/** Fase de liga / grupos
 * Una sola clave  ({ A: [] })             → liga, una tabla general
 * Múltiples claves ({ A: [], B: [], ... }) → grupos, tabla separada por grupo
 */
export interface LeaguePhase {
  id: string                  // debe coincidir exactamente con match_round de la API
  type: 'league'
  tiebreakers?: Tiebreaker[]  // override del tiebreaker global si es necesario
  advancement?: LeagueAdvancement
}

/** Fase eliminatoria */
export interface KnockoutPhase {
  id: string                  // debe coincidir exactamente con match_round de la API
  type: 'knockout'            // ej: "Octavos de final", "Cuartos de final", "Final"
  legs: 1 | 2                 // partidos por cruce (ida y vuelta o partido único)
  extra_time: boolean         // ¿hay tiempo extra?
  penalty_shootout: boolean   // ¿hay penales?
  bracket: BracketSlot[]      // cruces de esta fase
}

export type Phase = LeaguePhase | KnockoutPhase

// ------------------------------------------------------------
// TOURNAMENT SYSTEM — raíz
// ------------------------------------------------------------

export interface TournamentSystem {
  type: TournamentType

  /** Criterios de desempate globales — aplican a todas las fases salvo override */
  tiebreakers: Tiebreaker[]

  /**
   * Fases del torneo en orden cronológico.
   * El id de cada fase debe coincidir exactamente con el valor
   * que manda la API en match_round.
   * Excepción: las fechas numéricas ("1", "2", "3"...) se detectan
   * automáticamente y no necesitan una fase declarada.
   */
  phases: Phase[]
}