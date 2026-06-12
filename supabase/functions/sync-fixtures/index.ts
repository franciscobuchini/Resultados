// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const DR_KEY = Deno.env.get('DATAREDONDA_API_KEY')!
const DR_URL = 'https://hwzddjztuezdhnevwbjx.supabase.co/rest/v1/rpc/get_fixtures_by_date'

const HOURS_BACK = 1
const DAYS_AHEAD = 40

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
]
const randomDelay = () => new Promise(r => setTimeout(r, 800 + Math.random() * 1200))

const fetchFromDataRedonda = async (date: string): Promise<any[]> => {
  await randomDelay()
  const res = await fetch(DR_URL, {
    method: 'POST',
    headers: {
      'apikey': DR_KEY,
      'Authorization': `Bearer ${DR_KEY}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Accept-Language': 'es-AR,es;q=0.9,en;q=0.8',
      'Referer': 'https://www.dataredonda.com/',
      'Origin': 'https://www.dataredonda.com',
      'User-Agent': userAgents[Math.floor(Math.random() * userAgents.length)],
    },
    body: JSON.stringify({ art_date: date }),
  })
  if (!res.ok) throw new Error(`DataRedonda error ${res.status} para fecha ${date}`)
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

// ─────────────────────────────────────────────────────────────────────────────
// FUNCIÓN 1 — Sincronizar fixtures desde DataRedonda
// ─────────────────────────────────────────────────────────────────────────────
async function syncFixtures(): Promise<{ synced: number; unresolved: number; apiLeagueIds: number[]; allFixtures: any[]; teamMap: Map<string, { id: string; name: string }> }> {

 const dates: string[] = []
const cursor = new Date()
cursor.setHours(cursor.getHours() - HOURS_BACK)
cursor.setHours(0, 0, 0, 0) // normalizar a inicio de día para iterar por días
const limit = new Date()
limit.setDate(limit.getDate() + DAYS_AHEAD)
while (cursor <= limit) {
  dates.push(cursor.toISOString().split('T')[0])
  cursor.setDate(cursor.getDate() + 1)
}

  const { data: tournaments, error: tErr } = await supabase
    .from('tournaments')
    .select('tournament_id, tournament_id_api')
    .not('tournament_id_api', 'is', null)

  if (tErr) throw new Error(`Error buscando torneos activos: ${tErr.message}`)
  if (!tournaments || tournaments.length === 0) {
    console.log('No se encontraron torneos activos con ID de API')
    return { synced: 0, unresolved: 0, apiLeagueIds: [], allFixtures: [], teamMap: new Map() }
  }

  const tournamentMap = new Map<number, string>()
  const apiLeagueIds: number[] = []
  for (const t of tournaments) {
    if (t.tournament_id_api) {
      tournamentMap.set(Number(t.tournament_id_api), t.tournament_id)
      apiLeagueIds.push(Number(t.tournament_id_api))
    }
  }

  const allFixtures: any[] = []
  for (const date of dates) {
    const dayFixtures = await fetchFromDataRedonda(date)
    const matches = dayFixtures.filter(f => f.leagues?.sportmonks_id && tournamentMap.has(Number(f.leagues.sportmonks_id)))
    allFixtures.push(...matches)
    console.log(`📅 ${date}: ${matches.length} partidos de torneos activos`)
  }

  if (allFixtures.length === 0) {
    console.log('No se encontraron fixtures de torneos activos en el rango')
    return { synced: 0, unresolved: 0, apiLeagueIds, allFixtures: [], teamMap: new Map() }
  }

  const apiTeamIds = new Set<string>()
  for (const f of allFixtures) {
    if (f.home_team_id) apiTeamIds.add(String(f.home_team_id))
    if (f.away_team_id) apiTeamIds.add(String(f.away_team_id))
  }

  const { data: teamsData } = await supabase
    .from('teams')
    .select('team_id, team_name, team_id_api_drsm')
    .in('team_id_api_drsm', [...apiTeamIds])

  const teamMap = new Map<string, { id: string; name: string }>()
  for (const t of (teamsData ?? [])) {
    if (t.team_id_api_drsm) teamMap.set(String(t.team_id_api_drsm), {
      id: String(t.team_id),
      name: t.team_name ?? null,
    })
  }

  let unresolved = 0
  const rows = allFixtures.map((f: any) => {
    const startTime = f.start_time ?? ''
    const matchDate = startTime ? startTime.split('T')[0] : null
    const matchTime = startTime ? startTime.split('T')[1]?.substring(0, 8) : null

    const homeApiId = f.home_team_id ? String(f.home_team_id) : null
    const awayApiId = f.away_team_id ? String(f.away_team_id) : null
    const homeTeam = homeApiId ? teamMap.get(homeApiId) : null
    const awayTeam = awayApiId ? teamMap.get(awayApiId) : null

    if (!homeTeam || !awayTeam) {
      unresolved++
      console.warn(`⚠️ Sin resolver: fixture ${f.id} — home: ${homeApiId}, away: ${awayApiId}`)
    }

    const leagueIdApi = f.leagues?.sportmonks_id ? Number(f.leagues.sportmonks_id) : null
    const tournamentId = leagueIdApi ? tournamentMap.get(leagueIdApi) : null

    return {
      match_id: `${matchDate?.replace(/-/g, '')}${homeTeam?.id ?? homeApiId}${awayTeam?.id ?? awayApiId}`,
      match_id_api: f.sportmonks_id ?? null,
      match_date: matchDate,
      match_time_utc: matchTime,
      match_status: f.status === 'FT' ? 'Finalizado' : (f.status ?? null),
      game_time: f.minute ?? null,
      tournament_id: tournamentId,
      tournament_id_api: leagueIdApi,
      match_round: f.round ? `Fecha ${f.round}` : null,
      home_id: homeTeam?.id ?? null,
      home_name: homeTeam?.name ?? f.home_teams?.name ?? null,
      home_score: f.home_score ?? null,
      home_penalty: f.pen_home_score ?? null,
      away_id: awayTeam?.id ?? null,
      away_name: awayTeam?.name ?? f.away_teams?.name ?? null,
      away_score: f.away_score ?? null,
      away_penalty: f.pen_away_score ?? null,
    }
  })

  const { error } = await supabase
    .from('matches')
    .upsert(rows, { onConflict: 'match_id' })

  if (error) throw new Error(`Error en upsert: ${error.message}`)

  console.log(`✅ Función 1: ${rows.length} fixtures sincronizados (${unresolved} sin resolver)`)
  return { synced: rows.length, unresolved, apiLeagueIds, allFixtures, teamMap }
}

// ─────────────────────────────────────────────────────────────────────────────
// FUNCIÓN 2 — Cleanup: resuelve team_ids que quedaron null
// ─────────────────────────────────────────────────────────────────────────────
async function resolveTeamIds(apiLeagueIds: number[]): Promise<number> {
  if (apiLeagueIds.length === 0) return 0

  const { data: pendingFull, error } = await supabase
    .from('matches')
    .select('match_id, match_id_api, match_date')
    .in('tournament_id_api', apiLeagueIds)
    .or('home_id.is.null,away_id.is.null')

  if (error) throw new Error(`Error buscando pendientes: ${error.message}`)
  if (!pendingFull || pendingFull.length === 0) {
    console.log('✅ Función 2: no hay partidos pendientes')
    return 0
  }

  const uniqueDates = [...new Set(pendingFull.map(m => m.match_date).filter(Boolean))]

  let resolved = 0
  for (const date of uniqueDates) {
    const fixtures = await fetchFromDataRedonda(date)
    const activeFixtures = fixtures.filter(f => f.leagues?.sportmonks_id && apiLeagueIds.includes(Number(f.leagues.sportmonks_id)))

    const apiTeamIds = new Set<string>()
    for (const f of activeFixtures) {
      if (f.home_team_id) apiTeamIds.add(String(f.home_team_id))
      if (f.away_team_id) apiTeamIds.add(String(f.away_team_id))
    }
    if (apiTeamIds.size === 0) continue

    const { data: teamsData } = await supabase
      .from('teams')
      .select('team_id, team_name, team_id_api_drsm')
      .in('team_id_api_drsm', [...apiTeamIds])

    const teamMap = new Map<string, { id: string; name: string }>()
    for (const t of (teamsData ?? [])) {
      if (t.team_id_api_drsm) teamMap.set(String(t.team_id_api_drsm), {
        id: String(t.team_id),
        name: t.team_name ?? null,
      })
    }

    for (const f of activeFixtures) {
      const matchApiId = f.id ? Number(f.id) : (f.sportmonks_id ? Number(f.sportmonks_id) : null)
      if (!matchApiId) continue

      const pendingMatch = pendingFull.find(m => m.match_id_api === matchApiId)
      if (!pendingMatch) continue

      const homeTeam = f.home_team_id ? teamMap.get(String(f.home_team_id)) : null
      const awayTeam = f.away_team_id ? teamMap.get(String(f.away_team_id)) : null

      const updates: { home_id?: string; home_name?: string; away_id?: string; away_name?: string } = {}
      if (homeTeam) { updates.home_id = homeTeam.id; updates.home_name = homeTeam.name }
      if (awayTeam) { updates.away_id = awayTeam.id; updates.away_name = awayTeam.name }
      if (Object.keys(updates).length === 0) continue

      const { error: updateError } = await supabase
        .from('matches')
        .update(updates)
        .eq('match_id', pendingMatch.match_id)

      if (!updateError) resolved++
    }
  }

  console.log(`✅ Función 2: ${resolved} partidos resueltos`)
  return resolved
}

// ─────────────────────────────────────────────────────────────────────────────
// FUNCIÓN 3 — Sincronizar goles desde fixture_events
// ─────────────────────────────────────────────────────────────────────────────
async function syncGoals(allFixtures: any[], teamMap: Map<string, { id: string; name: string }>): Promise<number> {
  const goalRows: any[] = []

  for (const f of allFixtures) {
    const events = f.fixture_events ?? []
    const goalEvents = events.filter((e: any) => e.event_type === 'Goal' && e.is_valid)
    console.log(`⚽ Fixture ${f.sportmonks_id}: ${events.length} eventos, ${goalEvents.length} goles`)
    if (goalEvents.length === 0) continue

    const startTime = f.start_time ?? ''
    const matchDate = startTime ? startTime.split('T')[0]?.replace(/-/g, '') : null
    if (!matchDate) continue

    const homeApiId = f.home_team_id ? String(f.home_team_id) : null
    const awayApiId = f.away_team_id ? String(f.away_team_id) : null
    const homeTeam = homeApiId ? teamMap.get(homeApiId) : null
    const awayTeam = awayApiId ? teamMap.get(awayApiId) : null

    // Si no se resolvieron los equipos, no podemos construir el match_id ni el goal_id
    if (!homeTeam || !awayTeam) continue

    const matchId = `${matchDate}${homeTeam.id}${awayTeam.id}`

    // Ordenar goles por minuto para asignar número correlativo global
    const sorted = [...goalEvents].sort((a: any, b: any) => (a.minute ?? 0) - (b.minute ?? 0))

    let homeCount = 0
    let awayCount = 0

    for (const event of sorted) {
      const scorerApiId = String(event.team_id)
      const isHome = scorerApiId === homeApiId
      const side = isHome ? 'H' : 'A'

      if (isHome) homeCount++
      else awayCount++

      const goalNumber = isHome ? homeCount : awayCount
      const goalId = `${matchId}_${side}${goalNumber}`

      // Determinar tipo de gol
      let goalType = 'G'
      const info = event.details?.info?.toLowerCase() ?? ''
      const addition = event.details?.addition?.toLowerCase() ?? ''
      if (info.includes('penalty') || addition.includes('penalty')) goalType = 'P'
      else if (info.includes('own goal') || addition.includes('own goal')) goalType = 'C'

      const scoringTeamId = isHome ? homeTeam.id : awayTeam.id

      goalRows.push({
        goal_id: goalId,
        match_id: matchId,
        team_id: scoringTeamId,
        goal_minute: event.minute ?? null,
        player_name: event.player_name ?? null,
        goal_type: goalType,
      })
    }
  }

  if (goalRows.length === 0) {
    console.log('✅ Función 3: sin goles para sincronizar')
    return 0
  }

  const { error } = await supabase
    .from('goals')
    .upsert(goalRows, { onConflict: 'goal_id' })

  if (error) throw new Error(`Error en upsert de goles: ${error.message}`)

  console.log(`✅ Función 3: ${goalRows.length} goles sincronizados`)
  return goalRows.length
}

// ─────────────────────────────────────────────────────────────────────────────
// ENTRY POINT
// ─────────────────────────────────────────────────────────────────────────────
Deno.serve(async () => {
  try {
    const { synced, unresolved, apiLeagueIds, allFixtures, teamMap } = await syncFixtures()
    const resolved = unresolved > 0 ? await resolveTeamIds(apiLeagueIds) : 0
    const goals = await syncGoals(allFixtures, teamMap)

    return new Response(
      JSON.stringify({ success: true, synced, resolved, goals }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('❌ Error:', err)
    return new Response(
      JSON.stringify({ success: false, error: String(err) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})