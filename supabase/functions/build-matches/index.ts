import { createClient } from 'supabase'

Deno.serve(async (_req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  try {
    console.log("--- Inicio de build-matches (v3 - Dedup) ---");

    const [tRes, teRes, apiRes] = await Promise.all([
      supabase.from('tournaments').select('tournament_id, tournament_id_api'),
      supabase.from('teams').select('team_id, team_id_api'),
      supabase.from('apis').select('*')
    ])
    
    const tournamentLookup = new Map((tRes.data || []).map((t: any) => [Number(t.tournament_id_api), t.tournament_id]))
    const teamLookup = new Map((teRes.data || []).map((t: any) => [Number(t.team_id_api), t.team_id]))

    if (!apiRes.data || apiRes.data.length === 0) {
      console.log("No hay datos en la tabla 'apis'");
      return new Response(JSON.stringify({ success: true, built: 0, message: 'No hay datos en apis' }))
    }

    // Usar un Map para deduplicar por match_id, quedándose siempre con el gameTime más alto
    const matchMap: Record<string, any> = {}

    for (const apiEntry of apiRes.data) {
      const rawData = apiEntry.data;
      console.log(`Procesando API '${apiEntry.id}'`);

      let games: any[] = [];
      if (Array.isArray(rawData)) games = rawData;
      else if (rawData?.games && Array.isArray(rawData.games)) games = rawData.games;
      else if (rawData?.Games && Array.isArray(rawData.Games)) games = rawData.Games;
      else if (rawData?.matches && Array.isArray(rawData.matches)) games = rawData.matches;

      console.log(`- Juegos: ${games.length}`);

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

          // Si ya existe, solo reemplazar si el nuevo tiene gameTime mayor
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
    console.log(`Total de partidos únicos: ${allMatches.length}`);

    if (allMatches.length > 0) {
      const { error: upsertError } = await supabase
        .from('matches')
        .upsert(allMatches, { onConflict: 'match_id' })

      if (upsertError) {
        console.error("Error en upsert de matches:", upsertError);
        throw upsertError
      }
    }

    return new Response(JSON.stringify({ success: true, built: allMatches.length }))

  } catch (err: any) {
    console.error("Error crítico en build-matches:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})
