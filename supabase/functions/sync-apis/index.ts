import { createClient } from 'supabase'

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const apis: Record<string, string> = {
    results: `https://webws.365scores.com/web/games/results/?appTypeId=5&langId=14&timezoneName=America%2FBuenos_Aires&userCountryId=10&competitions=72&showOdds=true&includeTopBettingOpportunity=1&topBookmaker=14&t=${Date.now()}`,
    fixtures: `https://webws.365scores.com/web/games/fixtures/?appTypeId=5&langId=14&timezoneName=America%2FBuenos_Aires&userCountryId=346&competitions=72&showOdds=true&includeTopBettingOpportunity=1&t=${Date.now()}`
  }

  try {
    for (const [id, url] of Object.entries(apis)) {
      const res = await fetch(url, { 
        headers: { 
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36', 
          'Referer': 'https://www.365scores.com/',
          'Origin': 'https://www.365scores.com',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'es-AR,es;q=0.9,en;q=0.8',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        } 
      })
      
      if (!res.ok) continue
      const data = await res.json()

      // Guardamos únicamente el JSON bruto en la tabla 'apis'
      await supabase.from('apis').upsert({ 
        id, 
        data, 
        updated_at: new Date().toISOString() 
      })
    }

    // Disparar y ESPERAR a que la función de procesamiento termine
    const projectUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    console.log("Disparando build-matches...");
    const buildRes = await fetch(`${projectUrl}/functions/v1/build-matches`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${serviceKey}` }
    });
    
    const buildResult = await buildRes.text();
    console.log("Resultado build-matches:", buildResult);

    return new Response(`OK - Sincronizado y Procesado: ${buildResult}`)
  } catch (err) {
    return new Response(`Error: ${err.message}`, { status: 500 })
  }
})
