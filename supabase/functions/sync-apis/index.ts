import { createClient } from 'supabase'

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  try {
    console.log("--- Inicio de sync-apis (v4 - Todo en uno) ---");
    
    let type = 'all';
    const contentType = req.headers.get('content-type');
    if (req.method === 'POST' && contentType && contentType.includes('application/json')) {
      try {
        const body = await req.json();
        type = body.type || 'all';
        console.log(`Tipo de sincronización: ${type}`);
      } catch (_e) {
        console.log("No se pudo parsear el JSON del body, usando type='all'");
      }
    }

    // ═══════════════════════════════════════════════════════
    // PASO 1: Descargar datos de las APIs externas
    // ═══════════════════════════════════════════════════════
    const allApis: Record<string, string> = {
      results: `https://webws.365scores.com/web/games/results/?appTypeId=5&langId=14&timezoneName=America%2FBuenos_Aires&userCountryId=10&competitions=72&showOdds=true&includeTopBettingOpportunity=1&topBookmaker=14&t=${Date.now()}`,
      fixtures: `https://webws.365scores.com/web/games/fixtures/?appTypeId=5&langId=14&timezoneName=America%2FBuenos_Aires&userCountryId=346&competitions=72&showOdds=true&includeTopBettingOpportunity=1&t=${Date.now()}`
    }

    const toSync = type === 'all' ? Object.entries(allApis) : Object.entries(allApis).filter(([id]) => id === type);
    console.log(`APIs a sincronizar: ${toSync.map(s => s[0]).join(', ')}`);

    for (const [id, url] of toSync) {
      console.log(`Descargando ${id}...`);
      const res = await fetch(url, { 
        headers: { 
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36', 
          'Referer': 'https://www.365scores.com/',
          'Origin': 'https://www.365scores.com'
        } 
      })
      
      if (!res.ok) {
        console.error(`Error al descargar ${id}: ${res.status} ${res.statusText}`);
        continue;
      }
      
      const data = await res.json();
      console.log(`${id}: datos recibidos. Guardando...`);

      const { error: upsertError } = await supabase.from('apis').upsert({ 
        id, 
        data, 
        updated_at: new Date().toISOString() 
      });

      if (upsertError) {
        console.error(`Error al guardar ${id}:`, upsertError);
        throw upsertError;
      }
    }

    // ═══════════════════════════════════════════════════════
    // PASO 2: Construir matches (antes era build-matches)
    // ═══════════════════════════════════════════════════════
    console.log("--- Construyendo matches ---");

    const [tRes, teRes, apiRes] = await Promise.all([
      supabase.from('tournaments').select('tournament_id, tournament_id_api'),
      supabase.from('teams').select('team_id, team_id_api'),
      supabase.from('apis').select('*')
    ])

    const tournamentLookup = new Map((tRes.data || []).map((t: any) => [Number(t.tournament_id_api), t.tournament_id]))
    const teamLookup = new Map((teRes.data || []).map((t: any) => [Number(t.team_id_api), t.team_id]))

    if (!apiRes.data || apiRes.data.length === 0) {
      return new Response(`OK - Sincronizado, pero no hay datos en apis`)
    }

    // Deduplicar por match_id, quedándose con el gameTime más alto
    const matchMap: Record<string, any> = {}

    for (const apiEntry of apiRes.data) {
      const rawData = apiEntry.data;
      let games: any[] = [];
      if (Array.isArray(rawData)) games = rawData;
      else if (rawData?.games && Array.isArray(rawData.games)) games = rawData.games;
      else if (rawData?.Games && Array.isArray(rawData.Games)) games = rawData.Games;
      else if (rawData?.matches && Array.isArray(rawData.matches)) games = rawData.matches;

      console.log(`API '${apiEntry.id}': ${games.length} juegos`);

      for (const g of games) {
        try {
          const gameId = g.id || g.ID || g.gameId;
          const startTime = g.startTime || g.StartTime || g.start_time;
          if (!gameId || !startTime) continue;

          const datePart = startTime.split('T')[0].replace(/-/g, '')
          const homeId = teamLookup.get(Number(g.homeCompetitor?.id || g.home_team_id)) || String(g.homeCompetitor?.id || '');
          const awayId = teamLookup.get(Number(g.awayCompetitor?.id || g.away_team_id)) || String(g.awayCompetitor?.id || '');
          const tourId = tournamentLookup.get(Number(g.competitionId || g.tournamentId)) || String(g.competitionId || '');
          
          const matchId = `${datePart}${homeId}${awayId}`;
          const gameTime = g.gameTime ?? g.game_time ?? 0;

          const existing = matchMap[matchId];
          if (existing && existing.game_time >= gameTime) continue;

          matchMap[matchId] = {
            match_id: matchId,
            match_id_api: gameId,
            match_date: startTime.split('T')[0],
            match_time_utc: new Date(startTime).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
            match_status: g.statusText || g.status_text || 'Desconocido',
            game_time: gameTime,
            home_id: homeId,
            home_id_api: g.homeCompetitor?.id || null,
            home_name: g.homeCompetitor?.name || 'Local',
            home_score: (g.homeCompetitor?.score === -1 || g.homeCompetitor?.score === undefined) ? null : g.homeCompetitor.score,
            home_penalty: g.homeCompetitor?.penaltyScore || null,
            away_id: awayId,
            away_id_api: g.awayCompetitor?.id || null,
            away_name: g.awayCompetitor?.name || 'Visitante',
            away_score: (g.awayCompetitor?.score === -1 || g.awayCompetitor?.score === undefined) ? null : g.awayCompetitor.score,
            away_penalty: g.awayCompetitor?.penaltyScore || null,
            tournament_id: tourId,
            tournament_id_api: g.competitionId || null,
            match_round: (g.roundName && g.roundNum) ? `${g.roundName} ${g.roundNum}` : (g.roundName || g.roundNum || 'Fase Regular'),
            stadium_name: g.venue?.name || null
          }
        } catch (_e) {
          // skip
        }
      }
    }

    const allMatches = Object.values(matchMap);
    console.log(`Partidos únicos: ${allMatches.length}`);

    if (allMatches.length > 0) {
      const { error: upsertError } = await supabase
        .from('matches')
        .upsert(allMatches, { onConflict: 'match_id' })

      if (upsertError) {
        console.error("Error en upsert de matches:", upsertError);
        throw upsertError
      }
    }

    console.log("--- Sync completo ---");
    return new Response(`OK - ${allMatches.length} partidos sincronizados`)

  } catch (err: any) {
    console.error("Error crítico:", err);
    return new Response(`Error: ${err.message}`, { status: 500 })
  }
})
