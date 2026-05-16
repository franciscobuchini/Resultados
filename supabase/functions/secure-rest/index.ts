import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import CryptoJS from "npm:crypto-js";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
// IMPORTANTE: Deberás setear esta variable en el panel de Supabase o localmente
// supabase secrets set ENCRYPTION_KEY="TU_CLAVE_SECRETA_AQUI"
const ENCRYPTION_KEY = Deno.env.get('ENCRYPTION_KEY') || 'dev_secret_key_change_me_in_prod';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Manejar preflight de CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url);
    
    // Extraer la ruta que el cliente quiere consultar de la DB
    // Ej: /functions/v1/secure-rest/teams -> extraer "/teams"
    const pathParts = url.pathname.split('/secure-rest');
    const restPath = pathParts[1] || ''; 
    const queryString = url.search; 
    
    // Construir la URL final de la API REST de Supabase
    const targetUrl = `${SUPABASE_URL}/rest/v1${restPath}${queryString}`;

    // Hacer la consulta real a la base de datos
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
        // Copiamos los headers de rango por si hay paginación o límites
        'Range': req.headers.get('Range') || '',
        'Prefer': req.headers.get('Prefer') || 'return=representation',
      },
      // Reenviar el body si es POST, PATCH, etc.
      body: (req.method !== 'GET' && req.method !== 'HEAD') ? await req.text() : undefined,
    });

    if (!response.ok) {
      // Si hubo un error en la DB (ej: no existe la tabla), devolverlo tal cual
      const errorText = await response.text();
      return new Response(errorText, { 
        status: response.status, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Obtener los datos en JSON (texto)
    const data = await response.text();

    // Encriptar el JSON completo usando AES
    const encrypted = CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString();

    // Devolver el string encriptado al frontend
    const newHeaders = new Headers(corsHeaders);
    newHeaders.set('Content-Type', 'text/plain');
    
    // Copiar los headers de paginación/conteo si existen
    const contentRange = response.headers.get('content-range');
    if (contentRange) newHeaders.set('content-range', contentRange);

    return new Response(encrypted, {
      status: 200,
      headers: newHeaders,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
})
