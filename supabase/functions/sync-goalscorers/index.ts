import { createClient } from '@supabase/supabase-js'

const DR_URL = 'https://hwzddjztuezdhnevwbjx.supabase.co/rest/v1/rpc/get_fixtures_by_date'
const normalize = (s: string) => (s || '').toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
  const drKey = Deno.env.get('DATAREDONDA_API_KEY')!

  try {
    // Fechas a consultar: ayer, hoy y mañana (margen de zona horaria)
    const dates = [-1, 0, 1].map(offset => {
      const d = new Date()
      d.setUTCDate(d.getUTCDate() + offset)
      return d.toISOString().split('T')[0]
    })

    // Partidos del Mundial en nuestra DB
    const { data: wcMatches, error } = await supabase
      .from('matches')
      .select('match_id, match_date, home_name, away_name, home_id, away_id')
      .in('match_date', dates)
      .eq('tournament_id_api', 5930)

    if (error) throw error
    if (!wcMatches || wcMatches.length === 0) {
      return new Response(JSON.stringify({ success: true, message: 'Sin partidos del Mundial hoy' }), {
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Lookup por nombre normalizado + fecha
    const matchLookup = new Map<string, any>()
    for (const m of wcMatches) {
      const key = `${normalize(m.home_name)}_${normalize(m.away_name)}_${m.match_date}`
      matchLookup.set(key, m)
    }

    // Traer fixtures de DR para cada fecha
    const allFixtures: any[] = []
    for (const date of dates) {
      const res = await fetch(DR_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': drKey,
          'Authorization': `Bearer ${drKey}`
        },
        body: JSON.stringify({ art_date: date })
      })
      if (res.ok) {
        const data = await res.json()
        allFixtures.push(...(Array.isArray(data) ? data : []))
      }
    }

    const goalsToInsert: any[] = []
    const liveMatchIds: string[] = []

    for (const fixture of allFixtures) {
      if (!fixture.fixture_events?.length) continue

      const fixtureDate = fixture.start_time?.split('T')[0]
      if (!fixtureDate) continue

      // Buscar partido del Mundial en nuestra DB por nombre + fecha
      const key = `${normalize(fixture.home_teams?.name)}_${normalize(fixture.away_teams?.name)}_${fixtureDate}`
      const matchRow = matchLookup.get(key)
      if (!matchRow) continue

      // Si está en vivo, borrar goles antes de reinsertar (maneja VAR)
      if (fixture.status === 'live') liveMatchIds.push(matchRow.match_id)

      for (const event of fixture.fixture_events) {
        if (!event.is_valid) continue
        if (!['Goal', 'Penalty'].includes(event.event_type)) continue

        const isHome = event.team_id === fixture.home_team_id
        const teamId = isHome ? matchRow.home_id : matchRow.away_id

        const addition = (event.details?.addition || '').toLowerCase()
        let goalType = 'G'
        if (event.event_type === 'Penalty') goalType = 'P'
        if (addition.includes('own goal')) goalType = 'C'

        const safeName = (event.player_name || 'unknown')
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20)
        const goalId = `${matchRow.match_id}_${event.minute}_${isHome ? 'H' : 'A'}_${safeName}`

        goalsToInsert.push({
          goal_id: goalId,
          match_id: matchRow.match_id,
          team_id: teamId,
          goal_minute: event.minute,
          player_name: (event.player_name || 'Desconocido').substring(0, 50),
          goal_type: goalType
        })
      }
    }

    if (liveMatchIds.length > 0) {
      await supabase.from('goals').delete().in('match_id', liveMatchIds)
    }
    if (goalsToInsert.length > 0) {
      await supabase.from('goals').upsert(goalsToInsert, { onConflict: 'goal_id' })
    }

    console.log(`[GOALSCORERS] Fixtures revisados: ${allFixtures.length} | Goles guardados: ${goalsToInsert.length}`)

    return new Response(JSON.stringify({
      success: true,
      fixtures_revisados: allFixtures.length,
      goles_guardados: goalsToInsert.length
    }), { headers: { 'Content-Type': 'application/json' } })

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    })
  }
})