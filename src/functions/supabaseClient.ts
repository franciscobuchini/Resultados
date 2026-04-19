import { createClient } from '@supabase/supabase-js'

/**
 * ==========================================================================================
 * CONFIGURACIÓN DEL CLIENTE DE CONEXIÓN (FRONTEND -> BACKEND)
 * ==========================================================================================
 * Este archivo es el único "puente" que permite a tu aplicación de React hablar con
 * la base de datos de Supabase.
 * 
 * 1. VARIABLES DE ENTORNO: Utilizamos 'VITE_SUPABASE_URL' y 'VITE_SUPABASE_ANON_KEY'.
 *    Estas deben estar en tu archivo .env.local. Son seguras de exponer en el frontend
 *    siempre y cuando tengas activado el RLS (seguridad por filas) en tus tablas.
 * 
 * 2. CLIENTE ANON: A diferencia de la Edge Function, este cliente usa la llave 'anon'.
 *    Esto significa que solo tiene permiso para HACER lo que tú hayas permitido 
 *    explícitamente en las políticas de la base de datos (como la de lectura pública).
 * ==========================================================================================
 */

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltan las variables de entorno de Supabase en el archivo .env.local')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
