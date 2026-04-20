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
        const isHalftime = g.statusText === 'Entretiempo' || g.statusText === 'Descanso' || g.statusText === 'Medio Tiempo'

        let status = g.statusText || 'N/A'
        if (isFinal) status = 'Final'
        else if (isHalftime) status = 'ET'
        else if (g.gameTime > 0) status = `${g.gameTime}'`
        else {
          const date = new Date(g.startTime)
          status = date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })
        }

        // Nuevo formato de ID: YYYYMMDD + HomeID + AwayID + TournamentID
        const datePart = g.startTime.split('T')[0].replace(/-/g, '')
        const customId = `${datePart}${g.homeCompetitor.id}${g.awayCompetitor.id}${g.competitionId}`

        return {
          match_id: customId, // Seteamos el ID primario manualmente
          match_id_api: g.id,
          tournament_id: g.competitionId,
          match_date: g.startTime,
          stage_name: [g.roundName, g.roundNum, g.stageName].filter(Boolean).join(' ') || null,
          match_status: status,
          home_team_id: String(g.homeCompetitor.id), // Sin padding como pediste
          home_team_name: g.homeCompetitor.name,
          home_score: g.homeCompetitor.score === -1 ? null : g.homeCompetitor.score,
          home_penalty_score: g.homeCompetitor.penaltyScore ?? null,
          away_team_id: String(g.awayCompetitor.id), // Sin padding como pediste
          away_team_name: g.awayCompetitor.name,
          away_score: g.awayCompetitor.score === -1 ? null : g.awayCompetitor.score,
          away_penalty_score: g.awayCompetitor.penaltyScore ?? null
        }
      })

      // Sincronizar equipos con el nuevo formato (String simple sin ceros)
      const teamsToSync = new Map()
      data.games.forEach((g: Game) => {
        teamsToSync.set(String(g.homeCompetitor.id), {
          team_id: String(g.homeCompetitor.id),
          team_id_api: g.homeCompetitor.id,
          team_name: g.homeCompetitor.name
        })
        teamsToSync.set(String(g.awayCompetitor.id), {
          team_id: String(g.awayCompetitor.id),
          team_id_api: g.awayCompetitor.id,
          team_name: g.awayCompetitor.name
        })
      })

      if (teamsToSync.size > 0) {
        await supabase.from('teams').upsert(Array.from(teamsToSync.values()), { onConflict: 'team_id' })
      }

      if (matches.length > 0) {
        await supabase.from('matches').upsert(matches, { onConflict: 'match_id' })
      }
    } catch (e) {
      console.error(`Error en API ${id}:`, e)
    }
  }

  return new Response('OK')
})
