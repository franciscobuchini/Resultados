import { createClient } from 'supabase'

/**
 * ==========================================================================================
 * EXPLICACIÓN DEL SISTEMA DE SINCRONIZACIÓN (MODO COMPACTO)
 * ==========================================================================================
 * 1. SEGURIDAD DE ACCESO: Usamos 'SERVICE_ROLE_KEY' para que la función actúe como un robot
 *    con permisos totales. Esto permite que guarde datos en tu tabla 'apis' sin importar
 *    si hay bloqueos o reglas de seguridad de usuarios normales.
 * 
 * 2. ENDPOINTS: El objeto 'apis' guarda las URLs. La clave (ej: 'results') es el nombre
 *    con el que se registrará en tu base de datos. Puedes agregar más filas aquí.
 * 
 * 3. LAS 4 CAPAS DE SIGILO (ANTI-BLOQUEO):
 *    - Capa 1 (Jitter): Espera unos segundos al azar (setTimeout) para no ser un bot rítmico.
 *    - Capa 2 (Identidad): El 'User-Agent' hace creer a la API que somos Google Chrome.
 *    - Capa 3 (Mimicry): Las cabeceras 'Accept', 'Referer' y 'Origin' imitan la navegación 
 *      orgánica de un usuario que está parado dentro de la web de 365scores.
 * 
 * 4. VALIDACIÓN DE DATOS: Antes de guardar, el código verifica que el JSON tenga contenido.
 *    Si la API devuelve un error o un objeto vacío {}, el sistema se niega a guardar para
 *    proteger tus datos actuales y no sobreescribirlos con basura.
 * 
 * 5. PERSISTENCIA: El comando 'upsert' se encarga de crear el dato si no existe, o 
 *    actualizarlo si ya existe, manteniendo siempre la tabla con la versión más reciente.
 * ==========================================================================================
 */

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
  
  const apis = {
    results: 'https://webws.365scores.com/web/games/results/?appTypeId=5&langId=14&timezoneName=America%2FBuenos_Aires&userCountryId=10&competitions=72&showOdds=true&includeTopBettingOpportunity=1&topBookmaker=14',
    fixtures: 'https://webws.365scores.com/web/games/fixtures/?appTypeId=5&langId=14&timezoneName=America%2FBuenos_Aires&userCountryId=346&competitions=72&showOdds=true&includeTopBettingOpportunity=1&lastUpdateId=5630551343'
  }

  for (const [id, url] of Object.entries(apis)) {
    try {
      await new Promise(r => setTimeout(r, Math.random() * 3000))

      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
          'Accept': 'application/json',
          'Referer': 'https://www.365scores.com/',
          'Origin': 'https://www.365scores.com'
        }
      })

      if (res.ok) {
        const data = await res.json()
        if (data && Object.keys(data).length > 0) {
          await supabase.from('apis').upsert({ id, data })
        }
      }
    } catch {/* Silencio */}
  }

  return new Response("OK")
})
