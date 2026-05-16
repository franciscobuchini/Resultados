import { createClient } from '@supabase/supabase-js'
import CryptoJS from 'crypto-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
// Clave para desencriptar, asegúrate de ponerla en el .env
const encryptionKey = import.meta.env.VITE_ENCRYPTION_KEY || 'dev_secret_key_change_me_in_prod'

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltan las variables de entorno de Supabase en .env.local')
}

/**
 * Interceptor de Fetch Global
 * Enruta todas las peticiones a la DB por nuestra Edge Function de seguridad
 * y desencripta las respuestas antes de dárselas a React.
 */
const secureFetch = async (url: string | URL | Request, options?: RequestInit): Promise<Response> => {
  let requestUrl = '';
  if (typeof url === 'string') {
    requestUrl = url;
  } else if (url instanceof URL) {
    requestUrl = url.toString();
  } else if (url instanceof Request) {
    requestUrl = url.url;
  }

  // Solo interceptamos consultas a la base de datos (PostgREST)
  if (requestUrl.includes('/rest/v1/')) {
    // Redirigir a la Edge Function
    requestUrl = requestUrl.replace('/rest/v1/', '/functions/v1/secure-rest/')
    
    // Extraer headers y body del Request original si url es un objeto Request
    let fetchOptions = options || {};
    if (url instanceof Request) {
      const headers = new Headers(url.headers);
      if (options?.headers) {
        new Headers(options.headers).forEach((value, key) => headers.set(key, value));
      }
      fetchOptions = {
        ...options,
        method: url.method,
        headers: headers,
        body: (url.method !== 'GET' && url.method !== 'HEAD') ? url.body : undefined,
        credentials: url.credentials,
        mode: url.mode,
        cache: url.cache,
      };
    }

    const response = await fetch(requestUrl, fetchOptions)
    
    // Si falla o no tiene contenido, la devolvemos igual
    if (!response.ok) return response
    const encryptedText = await response.text()
    if (!encryptedText || encryptedText.trim() === '') {
      return new Response('', { status: 200, headers: response.headers })
    }

    try {
      // Desencriptar el payload
      const bytes = CryptoJS.AES.decrypt(encryptedText, encryptionKey)
      const decryptedJsonString = bytes.toString(CryptoJS.enc.Utf8)
      
      // Armar la respuesta JSON limpia para que supabase-js pueda procesarla
      const newHeaders = new Headers(response.headers)
      newHeaders.set('Content-Type', 'application/json')
      
      return new Response(decryptedJsonString, {
        status: response.status,
        headers: newHeaders,
      })
    } catch (e) {
      console.error('Error desencriptando datos protegidos:', e)
      throw new Error('Error de seguridad al recibir datos')
    }
  }

  // Si es Auth, Storage, etc., sigue su curso normal
  return fetch(url, options)
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  global: {
    fetch: secureFetch
  }
})
