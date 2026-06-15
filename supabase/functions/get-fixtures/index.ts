import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import CryptoJS from "https://esm.sh/crypto-js@4.2.0";

const DR_URL = 'https://hwzddjztuezdhnevwbjx.supabase.co/rest/v1/rpc/get_fixtures_by_date';
const ENCRYPTION_KEY = Deno.env.get('ENCRYPTION_KEY') || 'dev_secret_key_change_me_in_prod';

const cache = new Map<string, { data: any; ts: number }>();
const CACHE_TTL = 60_000;

const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
];

const randomDelay = () => new Promise(r => setTimeout(r, 800 + Math.random() * 1700));

const corsHeaders = {
  'Content-Type': 'text/plain',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ✅ CORREGIDO: POST con body en lugar de GET con query params
// ✅ CORREGIDO: agregado apikey en headers
const fetchFromDataRedonda = async (date: string, drKey: string) => {
  await randomDelay();
  const res = await fetch(DR_URL, {
    method: 'POST',
    headers: {
      'apikey': drKey,
      'Authorization': `Bearer ${drKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Accept-Language': 'es-AR,es;q=0.9,en;q=0.8',
      'Referer': 'https://www.dataredonda.com/',
      'Origin': 'https://www.dataredonda.com',
      'User-Agent': userAgents[Math.floor(Math.random() * userAgents.length)],
    },
    body: JSON.stringify({ art_date: date }),
  });

  if (!res.ok) throw new Error(`dataredonda error: ${res.status}`);
  return res.json();
};

export default {
  async fetch(req: Request) {
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    const url = new URL(req.url);
    const drKey = Deno.env.get('DATAREDONDA_API_KEY')!;


    const isBackendRequest =
      req.headers.get('X-Backend-Call') === 'true' ||
      url.searchParams.has('start') ||
      (req.method === 'GET' && !url.searchParams.has('encrypt'));

    // ==================== BACKEND ====================
    if (isBackendRequest) {
      try {
        const date = url.searchParams.get('date');
        const startDate = url.searchParams.get('start');
        const endDate = url.searchParams.get('end');

        if (!date && !startDate) {
          return new Response(
            JSON.stringify({ error: 'Parámetro requerido: ?date=YYYY-MM-DD o ?start=YYYY-MM-DD&end=YYYY-MM-DD' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        let data;

        if (date) {
          data = await fetchFromDataRedonda(date, drKey);


        } else if (startDate && endDate) {


          const dates: string[] = [];
          const current = new Date(startDate);
          const end = new Date(endDate);
          while (current <= end) {
            dates.push(current.toISOString().split('T')[0]);
            current.setDate(current.getDate() + 1);
          }

          const allData: any[] = [];
          for (const d of dates) {
            const dayData = await fetchFromDataRedonda(d, drKey);
            allData.push(...(Array.isArray(dayData) ? dayData : [dayData]));
          }
          data = allData;
        }

        return new Response(
          JSON.stringify({ success: true, data, saved: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      } catch (err: any) {

        return new Response(
          JSON.stringify({ error: err.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // ==================== FRONTEND ====================
    try {
      const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0];
      const now = Date.now();
      const cached = cache.get(date);

      if (cached && now - cached.ts < CACHE_TTL) {
        const encrypted = CryptoJS.AES.encrypt(JSON.stringify(cached.data), ENCRYPTION_KEY).toString();
        return new Response(encrypted, { headers: { ...corsHeaders, 'X-Cache': 'HIT' } });
      }


      const data = await fetchFromDataRedonda(date, drKey);

      cache.set(date, { data, ts: now });

      const encryptedData = CryptoJS.AES.encrypt(JSON.stringify(data), ENCRYPTION_KEY).toString();
      return new Response(encryptedData, { headers: { ...corsHeaders, 'X-Cache': 'MISS' } });

    } catch (err: any) {
      return new Response(
        JSON.stringify({ error: err.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }
};