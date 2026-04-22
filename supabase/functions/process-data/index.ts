import { createClient } from 'supabase'

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  try {
    // 1. Cargar traducciones (API -> Interno)
    const [{ data: tMap }, { data: teMap }, { data: rawApis }] = await Promise.all([
      supabase.from('tournaments').select('tournament_id, tournament_id_api'),
      supabase.from('teams').select('team_id, team_id_api'),
      supabase.from('apis').select('*')
    ])
    
    const tournamentLookup = new Map(tMap?.map(t => [Number(t.tournament_id_api), t.tournament_id]))
    const teamLookup = new Map(teMap?.map(t => [Number(t.team_id_api), t.team_id]))

    if (!rawApis) return new Response('No hay datos en apis')

    const allMatches: any[] = []

    for (const apiEntry of rawApis) {
      const games = apiEntry.data?.games || []
      
      const processed = games.map((g: any) => {
        const datePart = g.startTime.split('T')[0].replace(/-/g, '')
        
        // Buscar tus IDs internos o usar el de la API si no existe mapeo
        const homeId = teamLookup.get(Number(g.homeCompetitor.id)) || String(g.homeCompetitor.id)
        const awayId = teamLookup.get(Number(g.awayCompetitor.id)) || String(g.awayCompetitor.id)
        const tourId = tournamentLookup.get(Number(g.competitionId)) || String(g.competitionId)
        
        return {
          match_id: `${datePart}${homeId}${awayId}`, // Tu fórmula exacta
          match_id_api: g.id,
          match_date: g.startTime.split('T')[0],
          match_time: new Date(g.startTime).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
          match_status: g.statusText,
          game_time: g.gameTime || 0,
          
          home_id: homeId,
          home_id_api: g.homeCompetitor.id,
          home_name: g.homeCompetitor.name,
          home_score: g.homeCompetitor.score === -1 ? null : g.homeCompetitor.score,
          home_penalty: g.homeCompetitor.penaltyScore || null,
          
          away_id: awayId,
          away_id_api: g.awayCompetitor.id,
          away_name: g.awayCompetitor.name,
          away_score: g.awayCompetitor.score === -1 ? null : g.awayCompetitor.score,
          away_penalty: g.awayCompetitor.penaltyScore || null,
          
          tournament_id: tourId,
          tournament_id_api: g.competitionId,
          stage_name: g.stageName || null,
          round_name: g.roundName || null,
          round_num: g.roundNum || null,
          stadium_name: g.venue?.name || null,
          
          api_source: apiEntry.id,
          last_updated: new Date().toISOString()
        }
      })

      allMatches.push(...processed)
    }

    // 2. Upsert en la tabla 'matches' definitiva
    const { error: upsertError } = await supabase
      .from('matches')
      .upsert(allMatches, { onConflict: 'match_id' })

    if (upsertError) throw upsertError

    return new Response(JSON.stringify({ success: true, processed: allMatches.length }))

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})
