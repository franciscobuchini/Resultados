import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import CryptoJS from "https://esm.sh/crypto-js@4.2.0";

const DR_URL = 'https://hwzddjztuezdhnevwbjx.supabase.co/rest/v1/rpc/get_fixtures_by_date'
const ENCRYPTION_KEY = Deno.env.get('ENCRYPTION_KEY') || 'dev_secret_key_change_me_in_prod';

// Caché en memoria: date → { data, timestamp }
const cache = new Map<string, { data: any; ts: number }>()
const CACHE_TTL = 60_000 // 60 segundos

const corsHeaders = {
  'Content-Type': 'text/plain',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export default {
  async fetch(req: Request) {
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    const url = new URL(req.url)
    const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0]
    const drKey = Deno.env.get('DATAREDONDA_API_KEY')!

    try {
      const now = Date.now()
      const cached = cache.get(date)

      // Si hay caché vigente, devolver sin llamar a DR
      if (cached && now - cached.ts < CACHE_TTL) {
        const encryptedCached = CryptoJS.AES.encrypt(JSON.stringify(cached.data), ENCRYPTION_KEY).toString();
        return new Response(encryptedCached, {
          headers: { ...corsHeaders, 'X-Cache': 'HIT' }
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

      // Encriptar el JSON antes de enviarlo
      const encryptedData = CryptoJS.AES.encrypt(JSON.stringify(data), ENCRYPTION_KEY).toString();

      return new Response(encryptedData, {
        headers: { ...corsHeaders, 'X-Cache': 'MISS' }
      })

    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }
  }
}