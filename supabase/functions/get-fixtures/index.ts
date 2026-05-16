const DR_URL = 'https://hwzddjztuezdhnevwbjx.supabase.co/rest/v1/rpc/get_fixtures_by_date'

// Caché en memoria: date → { data, timestamp }
const cache = new Map<string, { data: any; ts: number }>()
const CACHE_TTL = 60_000 // 60 segundos

Deno.serve(async (req) => {
  const url = new URL(req.url)
  const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0]
  const drKey = Deno.env.get('DATAREDONDA_API_KEY')!

  try {
    const now = Date.now()
    const cached = cache.get(date)

    // Si hay caché vigente, devolver sin llamar a DR
    if (cached && now - cached.ts < CACHE_TTL) {
      return new Response(JSON.stringify(cached.data), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'X-Cache': 'HIT'
        }
      })
    }

    // Si no hay caché, llamar a DR y guardar
    const res = await fetch(DR_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': drKey,
        'Authorization': `Bearer ${drKey}`
      },
      body: JSON.stringify({ art_date: date })
    })

    if (!res.ok) throw new Error(`dataredonda error: ${res.status}`)
    const data = await res.json()

    cache.set(date, { data, ts: now })

    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'X-Cache': 'MISS'
      }
    })

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})