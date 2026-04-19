/**
 * ==========================================================================================
 * MANUAL DE ESTRUCTURA Y AUTOMATIZACIÓN DE BASE DE DATOS
 * ==========================================================================================
 * Este bloque contiene la definición total de tu backend en la base de datos.
 * 
 * 1. TABLA 'APIS': Es el almacén único de datos. 
 *    - 'id': Identificador único (ej: 'results', 'fixtures').
 *    - 'data': Columna tipo JSONB donde se guarda el objeto crudo de la API.
 * 
 * 2. SEGURIDAD (RLS): La tabla está bloqueada por defecto. La política "Lectura Pública"
 *    permite que cualquier persona (React) pueda consultar los datos pero NADIE externo
 *    puede modificarlos ni borrarlos.
 * 
 * 3. AUTOMATIZACIÓN (CRON): Se utiliza la extensión 'pg_cron' para disparar la función
 *    de sincronización cada 60 segundos exactos. Se programa pinchando en el SQL Editor.
 * ==========================================================================================
 */

-- [PARA RECREAR LA ESTRUCTURA SI ES NECESARIO]
-- CREATE TABLE IF NOT EXISTS public.apis (
--   id text primary key,
--   data jsonb,
--   updated_at timestamp with time zone default now()
-- );

-- [POLÍTICA DE SEGURIDAD PARA FRONTEND]
-- ALTER TABLE public.apis ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Lectura pública de apis" ON public.apis FOR SELECT USING (true);

-- [PROGRAMACIÓN DEL TRABAJO AUTOMÁTICO]
-- SELECT cron.schedule('fetch-football-data', '* * * * *', $$
--   SELECT net.http_post(url:='https://yngltjlglxlpfjawtxpp.supabase.co/functions/v1/sync-apis')
-- $$);
