import { createClient } from '@supabase/supabase-js'

Deno.serve(async (_req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  try {
    // 1. Determinar el tipo de sincronización (live, fixtures, results, o all)
    let reqData: any = {};
    if (_req.method === 'POST') {
      try { reqData = await _req.json(); } catch (e) { /* ignore */ }
    } else if (_req.method === 'GET') {
      const url = new URL(_req.url);
      reqData.type = url.searchParams.get('type');
    }
    
    const syncType = reqData.type || 'all';
    console.log(`[SYNC] Iniciando sincronización. Tipo: ${syncType}`);

    const allApis: Record<string, string> = {
      // results_72: `https://webws.365scores.com/web/games/results/?appTypeId=5&langId=14&timezoneName=America%2FBuenos_Aires&userCountryId=10&competitions=72&showOdds=true&includeTopBettingOpportunity=1&topBookmaker=14&t=${Date.now()}`,
      // fixtures_72: `https://webws.365scores.com/web/games/fixtures/?appTypeId=5&langId=14&timezoneName=America%2FBuenos_Aires&userCountryId=10&competitions=72&showOdds=true&includeTopBettingOpportunity=1&t=${Date.now()}`,
      // live_72: `https://webws.365scores.com/web/games/current/?appTypeId=5&langId=14&timezoneName=America%2FBuenos_Aires&userCountryId=10&competitions=72&showOdds=true&t=${Date.now()}`,
      // results_419: `https://webws.365scores.com/web/games/results/?appTypeId=5&langId=14&timezoneName=America%2FBuenos_Aires&userCountryId=10&competitions=419&showOdds=true&includeTopBettingOpportunity=1&topBookmaker=14&t=${Date.now()}`,
      // live_419: `https://webws.365scores.com/web/games/current/?appTypeId=5&langId=14&timezoneName=America%2FBuenos_Aires&userCountryId=10&competitions=419&showOdds=true&t=${Date.now()}`,
      // results_5077: `https://webws.365scores.com/web/games/results/?appTypeId=5&langId=14&timezoneName=America%2FBuenos_Aires&userCountryId=10&competitions=5077&showOdds=true&includeTopBettingOpportunity=1&topBookmaker=14&t=${Date.now()}`,
      // fixtures_5077: `https://webws.365scores.com/web/games/fixtures/?appTypeId=5&langId=14&timezoneName=America%2FBuenos_Aires&userCountryId=10&competitions=5077&showOdds=true&includeTopBettingOpportunity=1&t=${Date.now()}`,
      // live_5077: `https://webws.365scores.com/web/games/current/?appTypeId=5&langId=14&timezoneName=America%2FBuenos_Aires&userCountryId=10&competitions=5077&showOdds=true&t=${Date.now()}`,
      // results_640: `https://webws.365scores.com/web/games/results/?appTypeId=5&langId=14&timezoneName=America%2FBuenos_Aires&userCountryId=10&competitions=640&showOdds=true&includeTopBettingOpportunity=1&topBookmaker=14&t=${Date.now()}`,
      // fixtures_640: `https://webws.365scores.com/web/games/fixtures/?appTypeId=5&langId=14&timezoneName=America%2FBuenos_Aires&userCountryId=10&competitions=640&showOdds=true&includeTopBettingOpportunity=1&t=${Date.now()}`,
      // live_640: `https://webws.365scores.com/web/games/current/?appTypeId=5&langId=14&timezoneName=America%2FBuenos_Aires&userCountryId=10&competitions=640&showOdds=true&t=${Date.now()}`,
      // results_5078: `https://webws.365scores.com/web/games/results/?appTypeId=5&langId=14&timezoneName=America%2FBuenos_Aires&userCountryId=10&competitions=5078&showOdds=true&includeTopBettingOpportunity=1&topBookmaker=14&t=${Date.now()}`,
      // fixtures_5078: `https://webws.365scores.com/web/games/fixtures/?appTypeId=5&langId=14&timezoneName=America%2FBuenos_Aires&userCountryId=10&competitions=5078&showOdds=true&includeTopBettingOpportunity=1&t=${Date.now()}`,
      // live_5078: `https://webws.365scores.com/web/games/current/?appTypeId=5&langId=14&timezoneName=America%2FBuenos_Aires&userCountryId=10&competitions=5078&showOdds=true&t=${Date.now()}`,
      // results_5591: `https://webws.365scores.com/web/games/results/?appTypeId=5&langId=14&timezoneName=America%2FBuenos_Aires&userCountryId=10&competitions=5591&showOdds=true&includeTopBettingOpportunity=1&topBookmaker=14&t=${Date.now()}`,
      // fixtures_5591: `https://webws.365scores.com/web/games/fixtures/?appTypeId=5&langId=14&timezoneName=America%2FBuenos_Aires&userCountryId=10&competitions=5591&showOdds=true&includeTopBettingOpportunity=1&t=${Date.now()}`,
      // live_5591: `https://webws.365scores.com/web/games/current/?appTypeId=5&langId=14&timezoneName=America%2FBuenos_Aires&userCountryId=10&competitions=5591&showOdds=true&t=${Date.now()}`

      wc_5930_results: `https://webws.365scores.com/web/games/results/?appTypeId=5&langId=14&timezoneName=America%2FBuenos_Aires&userCountryId=10&competitions=5930&showOdds=true&includeTopBettingOpportunity=1&topBookmaker=14&t=${Date.now()}`,
      wc_5930_fixtures: `https://webws.365scores.com/web/games/fixtures/?appTypeId=5&langId=14&timezoneName=America%2FBuenos_Aires&userCountryId=10&competitions=5930&showOdds=true&includeTopBettingOpportunity=1&t=${Date.now()}`,
      wc_5930_live: `https://webws.365scores.com/web/games/current/?appTypeId=5&langId=14&timezoneName=America%2FBuenos_Aires&userCountryId=10&competitions=5930&showOdds=true&t=${Date.now()}`
    }

    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      'Referer': 'https://www.365scores.com/',
      'Origin': 'https://www.365scores.com',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'es-AR,es;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-site',
      'Sec-Ch-Ua': '"Chromium";v="131", "Not_A Brand";v="24"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Windows"'
    }

    // Helper: delay aleatorio entre requests para simular navegación humana
    const randomDelay = () => new Promise(r => setTimeout(r, 800 + Math.random() * 1700))

    // Filtrar APIs según el tipo solicitado
    const apisToFetch = Object.entries(allApis).filter(([id]) => {
      if (syncType === 'all') return true;
      return id.endsWith(`_${syncType}`);
    });

    if (apisToFetch.length === 0) {
      console.log(`[SYNC] No hay APIs para el tipo: ${syncType}`);
      return new Response(JSON.stringify({ success: true, message: `No hay APIs para el tipo: ${syncType}` }), { headers: { 'Content-Type': 'application/json' } })
    }

    // PASO 1: Descargar APIs solicitadas
    for (const [id, url] of apisToFetch) {
      try {
        console.log(`[SYNC] Descargando: ${id}`);
        const res = await fetch(url, { headers })
        if (res.ok) {
          const data = await res.json()
          await supabase.from('apis').upsert({ id, data, updated_at: new Date().toISOString() })
        }
      } catch (e) { console.error(`[SYNC] Error en ${id}:`, e) }
      await randomDelay() // Esperar entre 800ms y 2500ms entre cada request
    }

    // PASO 2: Construir matches
    const [tRes, teRes, apiRes] = await Promise.all([
      supabase.from('tournaments').select('tournament_id, tournament_id_api'),
      supabase.from('teams').select('team_id, team_id_api, team_name, team_crest_url'),
      supabase.from('apis').select('*')
    ])

    const tournamentLookup = new Map((tRes.data || []).map((t: any) => [Number(t.tournament_id_api), t.tournament_id]))
    const teamLookup = new Map((teRes.data || []).map((t: any) => [Number(t.team_id_api), { id: t.team_id, name: t.team_name, crest: t.team_crest_url }]))
    
    // Extraer IDs de competencias activas basándose solo en las APIs que estamos procesando en este ciclo
    const allowedCompetitions = new Set<number>()
    for (const [id, url] of apisToFetch) {
      const m = url.match(/competitions=(\d+)/)
      if (m) allowedCompetitions.add(Number(m[1]))
    }

    const matchMap: Record<string, any> = {}

    // Filtramos apiRes para procesar ÚNICAMENTE los datos de la categoría que descargamos
    // (Ej: si bajamos 'live', solo actualizamos matches usando los datos 'live' cacheados).
    // Esto evita procesar fixtures pasados o sobreescribir estados incorrectamente y hace la función muy rápida.
    const apisToProcess = (apiRes.data || []).filter(entry => {
      if (syncType === 'all') return true;
      return entry.id.endsWith(`_${syncType}`);
    });

    for (const apiEntry of apisToProcess) {
      const games = Array.isArray(apiEntry.data) ? apiEntry.data :
        apiEntry.data?.games || apiEntry.data?.Games || apiEntry.data?.matches || []

      for (const g of games) {
        try {
          const gameId = g.id || g.ID || g.gameId;
          const startTime = g.startTime || g.StartTime || g.start_time;
          if (!gameId || !startTime) continue;

          // Filtrar: solo procesar partidos de las competencias activas
          const compId = Number(g.competitionId || g.tournamentId || 0)
          if (compId && !allowedCompetitions.has(compId)) continue;

          const datePart = startTime.split('T')[0].replace(/-/g, '')
          const homeTeamInfo = teamLookup.get(Number(g.homeCompetitor?.id || g.home_team_id));
          const awayTeamInfo = teamLookup.get(Number(g.awayCompetitor?.id || g.away_team_id));

          const homeId = homeTeamInfo?.id || String(g.homeCompetitor?.id || '');
          const awayId = awayTeamInfo?.id || String(g.awayCompetitor?.id || '');
          const tourId = tournamentLookup.get(Number(g.competitionId || g.tournamentId)) || String(g.competitionId || '');

          const matchId = `${datePart}${homeId}${awayId}`;
          const gameTime = g.gameTime ?? g.game_time ?? 0;

          if (matchMap[matchId] && matchMap[matchId].game_time >= gameTime) continue;

          matchMap[matchId] = {
            match_id: matchId,
            match_id_api: gameId,
            match_date: startTime.split('T')[0],
            match_time_utc: new Date(startTime).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
            match_status: g.statusText || g.status_text || 'Desconocido',
            game_time: gameTime,
            home_id: homeId,
            home_id_api: g.homeCompetitor?.id || null,
            home_name: homeTeamInfo?.name || g.homeCompetitor?.name || 'Local',
            home_score: (g.homeCompetitor?.score === -1 || g.homeCompetitor?.score === undefined) ? null : g.homeCompetitor.score,
            home_penalty: g.homeCompetitor?.penaltyScore || null,
            away_id: awayId,
            away_id_api: g.awayCompetitor?.id || null,
            away_name: awayTeamInfo?.name || g.awayCompetitor?.name || 'Visitante',
            away_score: (g.awayCompetitor?.score === -1 || g.awayCompetitor?.score === undefined) ? null : g.awayCompetitor.score,
            away_penalty: g.awayCompetitor?.penaltyScore || null,
            tournament_id: tourId,
            tournament_id_api: g.competitionId || null,
            match_round: (g.roundName && g.roundNum) ? `${g.roundName} ${g.roundNum}` : (g.roundName || g.roundNum || 'Fase Regular'),
            stadium_name: g.venue?.name || null
          }
        } catch (_e) { /* skip */ }
      }
    }

    const allMatches = Object.values(matchMap);
    if (allMatches.length > 0) {
      await supabase.from('matches').upsert(allMatches, { onConflict: 'match_id' })
    }

    let crestCount = 0;

    // PASO 3: Actualizar crest_url de equipos (Solo lo hacemos 1 vez al día con fixtures, no en live)
    if (syncType === 'fixtures' || syncType === 'all') {
      // 365scores construye las imágenes así: https://imagecache.365scores.com/image/upload/...
      const crestUpdates: Record<number, string> = {} 

      for (const apiEntry of apisToProcess) {
        const games = Array.isArray(apiEntry.data) ? apiEntry.data :
          apiEntry.data?.games || apiEntry.data?.Games || apiEntry.data?.matches || []

        for (const g of games) {
          for (const competitor of [g.homeCompetitor, g.awayCompetitor]) {
            if (!competitor?.id || !competitor?.imageVersion) continue
            const teamApiId = Number(competitor.id)
            if (crestUpdates[teamApiId]) continue // ya lo tenemos
            crestUpdates[teamApiId] = `https://imagecache.365scores.com/image/upload/f_png,w_72,h_72,c_limit,q_auto:eco,dpr_2,d_Competitors:default1.png/v${competitor.imageVersion}/Competitors/${competitor.id}`
          }
        }
      }

      // Actualizar solo equipos que ya existen en la tabla teams (matcheados por team_id_api)
      for (const [teamApiId, crestUrl] of Object.entries(crestUpdates)) {
        const teamIdApiNum = Number(teamApiId);
        const existingTeam = teamLookup.get(teamIdApiNum);
        
        // Solo actualizar si el equipo existe
        if (existingTeam) {
          const hasCustomCrest = existingTeam.crest && existingTeam.crest.trim() !== "";
          
          if (!hasCustomCrest) {
            console.log(`[CrestSync] Actualizando escudo para: ${existingTeam.name} (${teamIdApiNum})`);
            const { error } = await supabase
              .from('teams')
              .update({ team_crest_url: crestUrl })
              .eq('team_id_api', teamIdApiNum)
            if (!error) crestCount++
          } else {
            // Comentamos este log para no ensuciar la consola con cientos de mensajes de "Saltando..."
            // console.log(`[CrestSync] Saltando ${existingTeam.name}: Ya tiene URL personalizada`);
          }
        }
      }
    }

    return new Response(JSON.stringify({ success: true, built: allMatches.length, crests_updated: crestCount }), { headers: { 'Content-Type': 'application/json' } })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
})
