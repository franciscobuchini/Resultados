import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  try {
    const url = new URL(req.url)
    const drKey = Deno.env.get('DATAREDONDA_API_KEY')!
    const DR_URL = 'https://hwzddjztuezdhnevwbjx.supabase.co/rest/v1/rpc/get_fixtures_by_date'
    
    // Parámetros de rango
    const daysToScan = parseInt(url.searchParams.get('days') || '1', 10)
    const startFrom = url.searchParams.get('start') || new Date().toISOString().split('T')[0]
    
    console.log(`[SyncDM] Iniciando escaneo masivo. Días: ${daysToScan}, Desde: ${startFrom}`)

    // 1. Obtener TODOS los equipos locales que aún no tienen ID de DM
    const { data: localTeams, error: fetchError } = await supabase
      .from('teams')
      .select('team_id, team_name, team_id_api_dm')
      .is('team_id_api_dm', null)

    if (fetchError) throw fetchError
    if (!localTeams || localTeams.length === 0) {
      return new Response(JSON.stringify({ success: true, message: "Todos los equipos ya están vinculados." }))
    }

    // Helper de normalización
    const normalize = (name: string) => name.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "")
      .trim()

    const localLookup = localTeams.map(t => ({ ...t, norm: normalize(t.team_name) }))
    const results = []
    let totalMatches = 0

    let daysScanned = 0
    for (let i = 0; i < daysToScan; i++) {
      daysScanned = i + 1;
      const currentDate = new Date(new Date(startFrom).getTime() - (i * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]
      console.log(`[SyncDM] Escaneando fecha: ${currentDate}...`)

      const res = await fetch(DR_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': drKey,
          'Authorization': `Bearer ${drKey}`
        },
        body: JSON.stringify({ art_date: currentDate })
      })

      if (!res.ok) {
        console.error(`[SyncDM] Error en fecha ${currentDate}: ${res.status}`)
        continue
      }

      const fixtures = await res.json()
      
      // 3. Buscar coincidencias en los fixtures del día
      for (const f of fixtures) {
        const competitors = [
          { id: f.home_team_id, name: f.home_teams?.name },
          { id: f.away_team_id, name: f.away_teams?.name }
        ]

        for (const comp of competitors) {
          if (!comp.id || !comp.name) continue
          const normDM = normalize(comp.name)
          
          const match = localLookup.find(l => l.norm === normDM)
          if (match) {
            // Actualizar en DB
            const { error: upError } = await supabase
              .from('teams')
              .update({ team_id_api_dm: comp.id })
              .eq('team_id', match.team_id)

            if (!upError) {
              totalMatches++
              // Quitar de la lista local para no procesarlo de nuevo en el siguiente día
              const idx = localLookup.indexOf(match)
              localLookup.splice(idx, 1)
              results.push({ team: match.team_name, id_dm: comp.id, date_found: currentDate })
            }
          }
        }
      }

      // Si ya vinculamos todos los equipos locales, terminamos antes
      if (localLookup.length === 0) break
      
      // Pequeño delay para no saturar la API
      await new Promise(r => setTimeout(r, 200))
    }

    return new Response(JSON.stringify({
      success: true,
      total_days_scanned: daysScanned,
      new_matches_found: totalMatches,
      remaining_teams_without_id: localLookup.length,
      details: results
    }), {
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
