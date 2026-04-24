import { createClient } from 'supabase'

Deno.serve(async (_req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  try {
    const allApis: Record<string, string> = {
      results: `https://webws.365scores.com/web/games/results/?appTypeId=5&langId=14&timezoneName=America%2FBuenos_Aires&userCountryId=10&competitions=72&showOdds=true&includeTopBettingOpportunity=1&topBookmaker=14&t=${Date.now()}`,
      fixtures: `https://webws.365scores.com/web/games/fixtures/?appTypeId=5&langId=14&timezoneName=America%2FBuenos_Aires&userCountryId=10&competitions=72&showOdds=true&includeTopBettingOpportunity=1&t=${Date.now()}`,
      live: `https://webws.365scores.com/web/games/current/?appTypeId=5&langId=14&timezoneName=America%2FBuenos_Aires&userCountryId=10&competitions=72&showOdds=true&t=${Date.now()}`
    }

    const headers = { 
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 
      'Referer': 'https://www.365scores.com/',
      'Origin': 'https://www.365scores.com'
    }

    // PASO 1: Descargar APIs SIEMPRE (ignoramos el body del cron para asegurar que 'live' y 'fixtures' se bajen)
    for (const [id, url] of Object.entries(allApis)) {
      try {
        const res = await fetch(url, { headers })
        if (res.ok) {
          const data = await res.json()
          await supabase.from('apis').upsert({ id, data, updated_at: new Date().toISOString() })
        }
      } catch (e) { /* ignorar errores individuales */ }
    }

    // PASO 2: Construir matches
    const [tRes, teRes, apiRes] = await Promise.all([
      supabase.from('tournaments').select('tournament_id, tournament_id_api'),
      supabase.from('teams').select('team_id, team_id_api, team_name'),
      supabase.from('apis').select('*')
    ])

    const tournamentLookup = new Map((tRes.data || []).map((t: any) => [Number(t.tournament_id_api), t.tournament_id]))
    const teamLookup = new Map((teRes.data || []).map((t: any) => [Number(t.team_id_api), { id: t.team_id, name: t.team_name }]))
    const matchMap: Record<string, any> = {}

    for (const apiEntry of apiRes.data || []) {
      const games = Array.isArray(apiEntry.data) ? apiEntry.data : 
                    apiEntry.data?.games || apiEntry.data?.Games || apiEntry.data?.matches || []

      for (const g of games) {
        try {
          const gameId = g.id || g.ID || g.gameId;
          const startTime = g.startTime || g.StartTime || g.start_time;
          if (!gameId || !startTime) continue;

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

    return new Response(JSON.stringify({ success: true, built: allMatches.length }), { headers: { 'Content-Type': 'application/json' } })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
})
