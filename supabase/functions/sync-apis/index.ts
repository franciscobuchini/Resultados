import { createClient } from 'supabase'

interface Game {
  id: number
  competitionId: number
  startTime: string
  statusGroup: number
  gameTime: number
  statusText: string
  homeCompetitor: { id: number; name: string; score: number; penaltyScore?: number }
  awayCompetitor: { id: number; name: string; score: number; penaltyScore?: number }
  roundName?: string
  roundNum?: number
  stageName?: string
}

const formatTeamId = (id: number) => String(id).padStart(6, '0')

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const apis: Record<string, string> = {
    results: `https://webws.365scores.com/web/games/results/?appTypeId=5&langId=14&timezoneName=America%2FBuenos_Aires&userCountryId=10&competitions=72&showOdds=true&includeTopBettingOpportunity=1&topBookmaker=14&t=${Date.now()}`,
    fixtures: `https://webws.365scores.com/web/games/fixtures/?appTypeId=5&langId=14&timezoneName=America%2FBuenos_Aires&userCountryId=346&competitions=72&showOdds=true&includeTopBettingOpportunity=1&t=${Date.now()}`
  }

  for (const [id, url] of Object.entries(apis)) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
          'Accept': 'application/json',
          'Referer': 'https://www.365scores.com/'
        }
      })

      if (!res.ok) continue

      const data = await res.json()
      if (!data?.games) continue

      await supabase.from('apis').upsert({
        id,
        data,
        updated_at: new Date().toISOString()
      })

      const matches = data.games.map((g: Game) => {
        const isFinal = g.statusGroup === 4 || g.statusGroup === 5 || g.statusText === 'Finalizado'
        const status = (!isFinal && g.gameTime > 0)
          ? `${g.gameTime}'`
          : isFinal ? 'Final' : (g.statusText || 'N/A')

        return {
          match_id_api: g.id,
          tournament_id: g.competitionId,
          match_date: g.startTime,
          stage_name: [g.roundName, g.roundNum, g.stageName].filter(Boolean).join(' ') || null,
          match_status: status,
          home_team_id: formatTeamId(g.homeCompetitor.id),
          home_team_name: g.homeCompetitor.name,
          home_score: g.homeCompetitor.score === -1 ? null : g.homeCompetitor.score,
          home_penalty_score: g.homeCompetitor.penaltyScore ?? null,
          away_team_id: formatTeamId(g.awayCompetitor.id),
          away_team_name: g.awayCompetitor.name,
          away_score: g.awayCompetitor.score === -1 ? null : g.awayCompetitor.score,
          away_penalty_score: g.awayCompetitor.penaltyScore ?? null
        }
      })

      if (matches.length > 0) {
        await supabase.from('matches').upsert(matches, { onConflict: 'match_id_api' })
      }
    } catch (e) {
      console.error(`Error en API ${id}:`, e)
    }
  }

  return new Response('OK')
})
