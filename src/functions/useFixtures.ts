import { useState, useEffect, useMemo } from 'react'
import { isLive, getMatchStatusLabel } from './matchHelpers'
import type { Match, Goal } from './computeStandings'
import { supabase } from './supabase'
import { getLeaguePriority } from './leagueTiers'
// ============================================================
// TYPES — Datos que devuelve la Edge Function get-fixtures
// ============================================================

export interface FixtureEvent {
  minute: number
  event_type: string
  team_id: number
  player_name: string | null
  is_valid: boolean
  extra_minute: number | null
  details: { addition: string; sportmonks_type_id: number }
}

export interface Fixture {
  id: number
  status: string
  current_minute: number | null
  start_time: string
  home_score: number | null
  away_score: number | null
  home_team_id: number
  away_team_id: number
  home_teams: { name: string; logo_path: string }
  away_teams: { name: string; logo_path: string }
  leagues: { name: string; logo_path: string }
  fixture_events: FixtureEvent[]
  pen_home_score?: number | null
  pen_away_score?: number | null
}

export interface AdaptedLeagueGroup {
  leagueName: string
  leagueLogo: string
  matchesByDate: Record<string, Match[]>
  goals: Goal[]
  teamLookup: Record<string, any>
}

// ============================================================
// HELPERS
// ============================================================

const STATUS_ORDER: Record<string, number> = { LIVE: 0, NS: 1, FT: 2 }
const POLL_INTERVAL = 60_000

/** Etiqueta humana para una fecha: "Hoy", "Ayer", "Mañana" o fecha completa */
export const formatDateLabel = (d: string): string => {
  const getLocalDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const now = new Date();
  const today = getLocalDate(now);

  const yesterdayDate = new Date(now);
  yesterdayDate.setDate(now.getDate() - 1);
  const yesterday = getLocalDate(yesterdayDate);

  const tomorrowDate = new Date(now);
  tomorrowDate.setDate(now.getDate() + 1);
  const tomorrow = getLocalDate(tomorrowDate);

  if (d === today) return 'Hoy'
  if (d === yesterday) return 'Ayer'
  if (d === tomorrow) return 'Mañana'
  return new Date(d + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
}

/** Determina el tipo de gol a partir de un FixtureEvent de dataredonda */
const getGoalType = (event: FixtureEvent): string => {
  if (event.event_type === 'Penalty') return 'P'
  if (event.details?.addition?.toLowerCase().includes('own goal')) return 'C'
  return 'G'
}

/** Filtra goles válidos de un fixture */
const getValidGoals = (fixture: Fixture) =>
  (fixture.fixture_events || []).filter(
    e => e.is_valid && ['Goal', 'Penalty'].includes(e.event_type)
  )

/** Ordena partidos: en vivo → no empezados → terminados, y dentro de cada grupo por hora */
const sortFixtures = (fixtures: Fixture[]): Fixture[] =>
  [...fixtures].sort((a, b) => {
    const sa = STATUS_ORDER[a.status?.toUpperCase()] ?? 1
    const sb = STATUS_ORDER[b.status?.toUpperCase()] ?? 1
    if (sa !== sb) return sa - sb
    return new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  })

/** Agrupa fixtures por liga, ordena y los adapta al formato de FixtureTable (Match/Goal) */
const groupAndAdaptFixtures = (fixtures: Fixture[], localTeamsMap: Map<number, any>): AdaptedLeagueGroup[] => {
  const byLeague = fixtures.reduce((acc, f) => {
    const key = f.leagues.name
    if (!acc[key]) acc[key] = { logo: f.leagues.logo_path, matches: [] as Fixture[] }
    acc[key].matches.push(f)
    return acc
  }, {} as Record<string, { logo: string; matches: Fixture[] }>)

  // Ligas ordenadas de forma absoluta por Tier List
  const sortedLeagueEntries = Object.entries(byLeague).sort(([nameA, a], [nameB, b]) => {
    // 1. Regla principal absoluta: Tier List
    const tierA = getLeaguePriority(nameA)
    const tierB = getLeaguePriority(nameB)
    if (tierA !== tierB) return tierA - tierB

    // 2. Solo en caso de empate (mismo Tier), priorizamos si alguna tiene partidos en vivo
    const aLive = a.matches.some(m => isLive(m.status)) ? 0 : 1
    const bLive = b.matches.some(m => isLive(m.status)) ? 0 : 1
    if (aLive !== bLive) return aLive - bLive

    // 3. Si todo empata, orden alfabético
    return nameA.localeCompare(nameB)
  })

  return sortedLeagueEntries.map(([leagueName, { logo, matches }]) => {
    const sorted = sortFixtures(matches)

    const mappedMatches: Match[] = sorted.map(f => {
      const homeLocal = localTeamsMap.get(f.home_team_id);
      const awayLocal = localTeamsMap.get(f.away_team_id);

      return {
        match_id: f.id.toString(),
        match_date: f.start_time.split('T')[0],
        match_time_utc: f.start_time.split('T')[1].substring(0, 5),
        match_status: f.status,
        match_status_label: getMatchStatusLabel(f.status, f.start_time.split('T')[0], f.current_minute),
        match_round: null,
        home_id: homeLocal?.team_id || f.home_team_id.toString(),
        home_name: homeLocal?.team_name || f.home_teams.name,
        home_logo: homeLocal?.team_crest_url || f.home_teams.logo_path,
        home_score: f.home_score,
        home_penalty: f.pen_home_score ?? null,
        away_id: awayLocal?.team_id || f.away_team_id.toString(),
        away_name: awayLocal?.team_name || f.away_teams.name,
        away_logo: awayLocal?.team_crest_url || f.away_teams.logo_path,
        away_score: f.away_score,
        away_penalty: f.pen_away_score ?? null,
        tournament_id: null
      }
    })

    const mappedGoals: Goal[] = sorted.flatMap(f =>
      getValidGoals(f).map((e, idx) => {
        const localGoalTeam = localTeamsMap.get(e.team_id);
        return {
          goal_id: `${f.id}-${idx}`,
          match_id: f.id.toString(),
          team_id: localGoalTeam?.team_id || e.team_id.toString(),
          goal_minute: e.minute,
          player_name: e.player_name || 'Desconocido',
          goal_type: getGoalType(e)
        };
      })
    )

    const teamLookup = sorted.reduce((acc, f) => {
      const homeLocal = localTeamsMap.get(f.home_team_id);
      const awayLocal = localTeamsMap.get(f.away_team_id);

      const hId = homeLocal?.team_id || f.home_team_id.toString();
      const aId = awayLocal?.team_id || f.away_team_id.toString();

      acc[hId] = {
        team_name: homeLocal?.team_name || f.home_teams.name,
        team_crest_url: homeLocal?.team_crest_url || f.home_teams.logo_path,
        team_id_api_drsm: f.home_team_id
      }
      acc[aId] = {
        team_name: awayLocal?.team_name || f.away_teams.name,
        team_crest_url: awayLocal?.team_crest_url || f.away_teams.logo_path,
        team_id_api_drsm: f.away_team_id
      }
      return acc
    }, {} as Record<string, any>)

    return {
      leagueName,
      leagueLogo: logo,
      matchesByDate: { "": mappedMatches },
      goals: mappedGoals,
      teamLookup
    }
  })
}

// ============================================================
// HOOK
// ============================================================

/**
 * useFixtures — Hook que encapsula toda la lógica de la HomePage:
 * - Fetch de fixtures por fecha
 * - Polling cada 60s
 * - Navegación de fechas
 * - Agrupación por liga y adaptación de datos a FixtureTable
 */
export function useFixtures() {
  const [fixtures, setFixtures] = useState<Fixture[]>([])
  const [localTeams, setLocalTeams] = useState<Map<number, any>>(new Map())
  const [loading, setLoading] = useState(true)
  const [date, setDate] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  })

  const fetchFixtures = async (d: string, silent = false, retryCount = 0) => {
    if (!silent) setLoading(true)
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-fixtures?date=${d}`,
        {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          }
        }
      )

      if (!res.ok) throw new Error(`Error ${res.status}`)
      const data = await res.json()

      const fixturesList = Array.isArray(data)
        ? data
        : (data && Array.isArray(data.data) ? data.data : null);

      if (fixturesList) {
        setFixtures(fixturesList)
      } else if (retryCount === 0) {
        setTimeout(() => fetchFixtures(d, true, 1), 3000)
      }
    } catch (err: any) {
      console.error(`[useFixtures] Error fetching date ${d}:`, err.message)
      if (retryCount === 0) {
        setTimeout(() => fetchFixtures(d, true, 1), 3000)
      }
    }
    if (!silent) setLoading(false)
  }

  // Cargar mapeo de equipos locales
  useEffect(() => {
    const fetchLocalTeams = async () => {
      const { data } = await supabase
        .from('teams')
        .select('team_id, team_name, team_crest_url, team_id_api_drsm')
        .not('team_id_api_drsm', 'is', null)

      if (data) {
        const map = new Map()
        data.forEach(t => map.set(Number(t.team_id_api_drsm), t))
        setLocalTeams(map)
      }
    }
    fetchLocalTeams()
  }, [])

  useEffect(() => {
    fetchFixtures(date)
    const interval = setInterval(() => fetchFixtures(date, true), POLL_INTERVAL)
    return () => clearInterval(interval)
  }, [date])

  const changeDate = (offset: number) => {
    const d = new Date(date + 'T12:00:00')
    d.setDate(d.getDate() + offset)
    setDate(d.toISOString().split('T')[0])
  }

  const adaptedLeagues = useMemo(() => groupAndAdaptFixtures(fixtures, localTeams), [fixtures, localTeams])
  const dateLabel = formatDateLabel(date)

  return { loading, date, dateLabel, adaptedLeagues, changeDate }
}
