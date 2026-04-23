import { createClient } from 'supabase'

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  try {
    console.log("--- Inicio de sync-apis ---");
    
    let type = 'all';
    const contentType = req.headers.get('content-type');
    if (req.method === 'POST' && contentType && contentType.includes('application/json')) {
      try {
        const body = await req.json();
        type = body.type || 'all';
        console.log(`Tipo de sincronización: ${type}`);
      } catch (e) {
        console.log("No se pudo parsear el JSON del body, usando type='all'");
      }
    }

    const allApis: Record<string, string> = {
      results: `https://webws.365scores.com/web/games/results/?appTypeId=5&langId=14&timezoneName=America%2FBuenos_Aires&userCountryId=10&competitions=72&showOdds=true&includeTopBettingOpportunity=1&topBookmaker=14&t=${Date.now()}`,
      fixtures: `https://webws.365scores.com/web/games/fixtures/?appTypeId=5&langId=14&timezoneName=America%2FBuenos_Aires&userCountryId=346&competitions=72&showOdds=true&includeTopBettingOpportunity=1&t=${Date.now()}`
    }

    const toSync = type === 'all' ? Object.entries(allApis) : Object.entries(allApis).filter(([id]) => id === type);
    console.log(`APIs a sincronizar: ${toSync.map(s => s[0]).join(', ')}`);

    for (const [id, url] of toSync) {
      console.log(`Descargando ${id} desde ${url}...`);
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
      console.log(`Datos recibidos para ${id}. Guardando en base de datos...`);

      const { error: upsertError } = await supabase.from('apis').upsert({ 
        id, 
        data, 
        updated_at: new Date().toISOString() 
      });

      if (upsertError) {
        console.error(`Error al guardar ${id} en DB:`, upsertError);
        throw upsertError;
      }
    }

    // DISPARAR LA SEGUNDA FUNCIÓN USANDO EL SDK (Más seguro)
    console.log("Disparando build-matches vía SDK...");
    const { data: buildData, error: buildInvokeError } = await supabase.functions.invoke('build-matches', {
      method: 'POST'
    });
    
    if (buildInvokeError) {
      console.error("Error al invocar build-matches:", buildInvokeError);
      throw buildInvokeError;
    }

    console.log("Resultado build-matches:", buildData);

    return new Response(`OK - Sincronizado y Procesado: ${JSON.stringify(buildData)}`)
  } catch (err) {
    console.error("Error crítico en sync-apis:", err);
    return new Response(`Error: ${err.message}`, { status: 500 })
  }
})
