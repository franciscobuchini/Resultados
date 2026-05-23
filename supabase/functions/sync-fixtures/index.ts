// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const SUPABASE_URL     = Deno.env.get('SUPABASE_URL')!
const SUPABASE_KEY     = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const DR_KEY           = Deno.env.get('DATAREDONDA_API_KEY')!
const DR_URL           = 'https://hwzddjztuezdhnevwbjx.supabase.co/rest/v1/rpc/get_fixtures_by_date'

const LEAGUE_ID        = 732
const DAYS_AHEAD       = 40

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
      'apikey':           DR_KEY,
      'Authorization':    `Bearer ${DR_KEY}`,
      'Content-Type':     'application/json',
      'Accept':           'application/json',
      'Accept-Language':  'es-AR,es;q=0.9,en;q=0.8',
      'Referer':          'https://www.dataredonda.com/',
      'Origin':           'https://www.dataredonda.com',
      'User-Agent':       userAgents[Math.floor(Math.random() * userAgents.length)],
    },
    body: JSON.stringify({ art_date: date }),
  })
  if (!res.ok) throw new Error(`DataRedonda error ${res.status} para fecha ${date}`)
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

// ─────────────────────────────────────────────────────────────────────────────
// FUNCIÓN 1 — Sincronizar fixtures del Mundial desde DataRedonda
// ─────────────────────────────────────────────────────────────────────────────
async function syncFixtures(): Promise<{ synced: number; unresolved: number }> {

  const dates: string[] = []
  const cursor = new Date()
  const limit  = new Date()
  limit.setDate(limit.getDate() + DAYS_AHEAD)
  while (cursor <= limit) {
    dates.push(cursor.toISOString().split('T')[0])
    cursor.setDate(cursor.getDate() + 1)
  }

  const { data: tournament } = await supabase
    .from('tournaments')
    .select('tournament_id')
    .eq('tournament_id_api', LEAGUE_ID)
    .single()
  const tournamentId = tournament?.tournament_id ?? null

  const allFixtures: any[] = []
  for (const date of dates) {
    const dayFixtures = await fetchFromDataRedonda(date)
    const wc = dayFixtures.filter(f => f.leagues?.sportmonks_id === LEAGUE_ID)
    allFixtures.push(...wc)
    console.log(`📅 ${date}: ${wc.length} partidos del Mundial`)
  }

  if (allFixtures.length === 0) {
    console.log('No se encontraron fixtures del Mundial en el rango')
    return { synced: 0, unresolved: 0 }
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
      id:   String(t.team_id),
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
    const homeTeam  = homeApiId ? teamMap.get(homeApiId) : null
    const awayTeam  = awayApiId ? teamMap.get(awayApiId) : null

    if (!homeTeam || !awayTeam) {
      unresolved++
      console.warn(`⚠️ Sin resolver: fixture ${f.id} — home: ${homeApiId}, away: ${awayApiId}`)
    }

    return {
      match_id:          `${matchDate?.replace(/-/g, '')}${homeTeam?.id ?? homeApiId}${awayTeam?.id ?? awayApiId}`,
      match_id_api:      f.sportmonks_id ?? null,
      match_date:        matchDate,
      match_time_utc:    matchTime,
      match_status:      f.status ?? null,
      game_time:         f.minute ?? null,
      tournament_id:     tournamentId,
      tournament_id_api: LEAGUE_ID,
      match_round:       f.round ? `Fecha ${f.round}` : null,
      home_id:           homeTeam?.id ?? null,
      home_name:         homeTeam?.name ?? f.home_teams?.name ?? null,
      home_score:        f.home_score ?? null,
      home_penalty:      f.pen_home_score ?? null,
      away_id:           awayTeam?.id ?? null,
      away_name:         awayTeam?.name ?? f.away_teams?.name ?? null,
      away_score:        f.away_score ?? null,
      away_penalty:      f.pen_away_score ?? null,
    }
  })

  const { error } = await supabase
    .from('matches')
    .upsert(rows, { onConflict: 'match_id' })

  if (error) throw new Error(`Error en upsert: ${error.message}`)

  console.log(`✅ Función 1: ${rows.length} fixtures sincronizados (${unresolved} sin resolver)`)
  return { synced: rows.length, unresolved }
}

// ─────────────────────────────────────────────────────────────────────────────
// FUNCIÓN 2 — Cleanup: resuelve team_ids que quedaron null
// ─────────────────────────────────────────────────────────────────────────────
async function resolveTeamIds(): Promise<number> {
  const { data: pendingFull, error } = await supabase
    .from('matches')
    .select('match_id, match_date')
    .eq('tournament_id_api', LEAGUE_ID)
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
    const wcFixtures = fixtures.filter(f => f.leagues?.sportmonks_id === LEAGUE_ID)

    const apiTeamIds = new Set<string>()
    for (const f of wcFixtures) {
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
        id:   String(t.team_id),
        name: t.team_name ?? null,
      })
    }

    for (const f of wcFixtures) {
      const matchId   = String(f.id)
      const isPending = pendingFull.some(m => m.match_id === matchId)
      if (!isPending) continue

      const homeTeam = f.home_team_id ? teamMap.get(String(f.home_team_id)) : null
      const awayTeam = f.away_team_id ? teamMap.get(String(f.away_team_id)) : null

      const updates: { home_id?: string; home_name?: string; away_id?: string; away_name?: string } = {}
      if (homeTeam) { updates.home_id = homeTeam.id; updates.home_name = homeTeam.name }
      if (awayTeam) { updates.away_id = awayTeam.id; updates.away_name = awayTeam.name }
      if (Object.keys(updates).length === 0) continue

      const { error: updateError } = await supabase
        .from('matches')
        .update(updates)
        .eq('match_id', matchId)

      if (!updateError) resolved++
    }
  }

  console.log(`✅ Función 2: ${resolved} partidos resueltos`)
  return resolved
}

// ─────────────────────────────────────────────────────────────────────────────
// ENTRY POINT
// ─────────────────────────────────────────────────────────────────────────────
Deno.serve(async () => {
  try {
    const { synced, unresolved } = await syncFixtures()
    const resolved = unresolved > 0 ? await resolveTeamIds() : 0

    return new Response(
      JSON.stringify({ success: true, synced, resolved }),
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