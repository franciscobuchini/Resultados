import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import CryptoJS from "npm:crypto-js";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const ENCRYPTION_KEY = Deno.env.get('ENCRYPTION_KEY') || 'dev_secret_key_change_me_in_prod';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, prefer, range',
};

export default {
  async fetch(req: Request) {
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    try {
      const url = new URL(req.url);
      
      const pathParts = url.pathname.split('/secure-rest');
      const restPath = pathParts[1] || ''; 
      const queryString = url.search; 
      
      const targetUrl = `${SUPABASE_URL}/rest/v1${restPath}${queryString}`;

      const response = await fetch(targetUrl, {
        method: req.method,
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
          'Range': req.headers.get('Range') || '',
          'Prefer': req.headers.get('Prefer') || 'return=representation',
        },
        body: (req.method !== 'GET' && req.method !== 'HEAD') ? await req.text() : undefined,
      });

      if (!response.ok) {
        const errorText = await response.text();
        return new Response(errorText, { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }

      const data = await response.text();
      const encrypted = CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString();

      const newHeaders = new Headers(corsHeaders);
      newHeaders.set('Content-Type', 'text/plain');
      
      const contentRange = response.headers.get('content-range');
      if (contentRange) newHeaders.set('content-range', contentRange);

      return new Response(encrypted, {
        status: 200,
        headers: newHeaders,
      });

    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }
};
