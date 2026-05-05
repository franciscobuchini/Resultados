// ============================================================
// TOURNAMENT SYSTEM — Paso 6: Motor principal del torneo
// Encadena todos los pasos anteriores en una sola función
// ============================================================

import type { TournamentSystem, LeaguePhase, KnockoutPhase } from './tournamentTypes'
import { computeStandings, type Standings } from './computeStandings'
import { computeWildcards, type WildcardTeam } from './computeWildcards'
import { resolveBracket, type ResolvedBracket } from './resolveBracket'
import type { Match } from './matchTypes'

// ------------------------------------------------------------
// TIPOS
// ------------------------------------------------------------

/** Todo lo que necesita el motor para funcionar */
export interface TournamentEngineInput {
  system: TournamentSystem

  /** Columna tournament_teams de la tabla tournaments */
  tournamentTeams: Record<string, string[]>

  /** Mapa de team_id → team_name para mostrar nombres */
  teamNames: Record<string, string>

  /** Partidos de la fase de liga ya traídos de Supabase */
  leagueMatches: Match[]

  /**
   * Partidos de cada fase knockout ya traídos de Supabase.
   * La clave es el id de la fase — ej: "Octavos de final"
   */
  knockoutMatches: Record<string, Match[]>
}

/** Todo lo que devuelve el motor — el estado completo del torneo */
export interface TournamentState {
  standings: Standings                 // tabla de posiciones por grupo
  wildcards: WildcardTeam[]           // mejores terceros clasificados
  brackets: ResolvedBracket[]         // bracket de cada fase knockout en orden
}

// ------------------------------------------------------------
// HELPERS
// ------------------------------------------------------------

/**
 * Construye matchStatuses y matchWinners a partir de los partidos
 * de una fase knockout para pasarlos a resolveBracket.
 *
 * Necesita que los partidos tengan un campo extra `bracket_slot`
 * en match_notes o similar para saber a qué slot pertenecen.
 * Por ahora usamos home_id + away_id para matchear con el bracket.
 */
const buildMatchMaps = (
  matches: Match[],
  bracket: ResolvedBracket
): {
  statuses: Record<number, string>
  winners: Record<number, string>
} => {
  const statuses: Record<number, string> = {}
  const winners: Record<number, string> = {}

  for (const slot of bracket.slots) {
    if (!slot.home || !slot.away) continue

    const match = matches.find(
      (m) =>
        (m.home_id === slot.home!.team_id && m.away_id === slot.away!.team_id) ||
        (m.home_id === slot.away!.team_id && m.away_id === slot.home!.team_id)
    )

    if (!match) continue

    if (match.match_status) {
      statuses[slot.slot] = match.match_status
    }

    // Determinar ganador si el partido terminó
    if (
      match.home_score !== null &&
      match.away_score !== null &&
      (match.match_status === 'FT' ||
        match.match_status === 'AET' ||
        match.match_status === 'PEN')
    ) {
      let winnerId: string | null = null

      if (match.match_status === 'PEN') {
        // En penales el ganador es quien tiene más penales
        if (match.home_penalty !== null && match.away_penalty !== null) {
          winnerId =
            match.home_penalty > match.away_penalty
              ? match.home_id
              : match.away_id
        }
      } else {
        // En tiempo normal o extra
        if (match.home_score > match.away_score) {
          winnerId = match.home_id
        } else if (match.away_score > match.home_score) {
          winnerId = match.away_id
        }
      }

      if (winnerId) winners[slot.slot] = winnerId
    }
  }

  return { statuses, winners }
}

// ------------------------------------------------------------
// FUNCIÓN PRINCIPAL
// ------------------------------------------------------------

/**
 * Motor principal del torneo.
 * Recibe los datos crudos y devuelve el estado completo del torneo.
 *
 * Uso:
 * const state = computeTournament({ system, tournamentTeams, teamNames, leagueMatches, knockoutMatches })
 * → state.standings   — tabla de posiciones
 * → state.wildcards   — mejores terceros
 * → state.brackets    — bracket eliminatorio
 */
export function computeTournament(input: TournamentEngineInput): TournamentState {
  const { system, tournamentTeams, teamNames, leagueMatches, knockoutMatches } = input

  // --- Paso 3: Tabla de posiciones ---
  const leaguePhase = system.phases.find(
    (p): p is LeaguePhase => p.type === 'league'
  )

  const standings: Standings = leaguePhase
    ? computeStandings(
        leagueMatches,
        tournamentTeams,
        teamNames,
        leaguePhase,
        system.tiebreakers
      )
    : {}

  // --- Paso 4: Wildcards ---
  const wildcardConfig = leaguePhase?.advancement?.wildcard
  const wildcards: WildcardTeam[] = wildcardConfig
    ? computeWildcards(
        standings,
        wildcardConfig.from_position,
        wildcardConfig.count,
        wildcardConfig.tiebreakers
      )
    : []

  // --- Paso 5: Bracket knockout —
  // Resuelve cada fase knockout en orden, pasando los brackets anteriores
  // para poder resolver refs del tipo { from: 'slot', phase: '...', slot: N }
  const knockoutPhases = system.phases.filter(
    (p): p is KnockoutPhase => p.type === 'knockout'
  )

  const brackets: ResolvedBracket[] = []

  for (const phase of knockoutPhases) {
    const phaseMatches = knockoutMatches[phase.id] ?? []

    // Primera pasada: resolver equipos sin partidos aún
    const partialBracket = resolveBracket(
      phase,
      standings,
      wildcards,
      brackets,
      {},
      {}
    )

    // Segunda pasada: si hay partidos, agregar estados y ganadores
    const { statuses, winners } = buildMatchMaps(phaseMatches, partialBracket)

    const resolvedBracket = resolveBracket(
      phase,
      standings,
      wildcards,
      brackets,
      statuses,
      winners
    )

    brackets.push(resolvedBracket)
  }

  return { standings, wildcards, brackets }
}