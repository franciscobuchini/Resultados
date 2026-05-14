// ============================================================
// matchHelpers — Funciones compartidas para lógica de partidos
// Usadas por FixtureTable (datos de DB) y HomePage (datos de API)
// ============================================================

/**
 * Determina si un partido ya empezó o terminó, basado en su status string.
 * Funciona con cualquier fuente de datos (DB o API externa).
 */
export const isPlayedOrPlaying = (status: string | null): boolean => {
  if (!status) return false;
  const s = status.toLowerCase().trim();
  const notStarted = ['ns', 'tbd', 'scheduled', 'postponed', 'cancelled'].includes(s);
  return !notStarted && s !== '';
};

/**
 * Formatea el nombre de un goleador con su etiqueta de tipo.
 * Acepta parámetros genéricos para funcionar con cualquier fuente de datos.
 *
 * @param playerName  Nombre del jugador
 * @param goalType    Tipo: 'G' = normal, 'P' = penalty, 'C' | 'EC' = en contra
 */
export const formatGoalLabel = (playerName: string, goalType: string): string => {
  let name = playerName || 'Desconocido';
  const t = goalType.toUpperCase();

  if (t === 'P' && !name.toUpperCase().includes('(P)')) name += ' (P)';
  else if ((t === 'C' || t === 'EC') && !name.toUpperCase().includes('(EC)')) name += ' (EC)';

  return name;
};

/**
 * Determina si un partido está en vivo.
 */
export const isLive = (status: string | null): boolean => {
  if (!status) return false;
  const s = status.toUpperCase().trim();
  const codes = ['LIVE', 'HT', 'ET', 'PEN_LIVE', '1H', '2H'];
  return codes.includes(s) || !isNaN(Number(s));
};

/**
 * Devuelve la etiqueta de estado (Minuto o "Final") SOLO si el partido es hoy.
 */
export const getMatchStatusLabel = (
  status: string | null,
  date: string | null,
  currentMinute?: number | null
): string | null => {
  if (!status || !date) return null;

  // Solo nos interesa para el día de hoy
  const today = new Date().toISOString().split('T')[0];
  if (date !== today) return null;

  const s = status.toUpperCase().trim();

  // Si está en vivo
  if (isLive(s)) {
    if (s === 'HT') return 'ET'; // Entretiempo
    
    // Si el status mismo es el minuto
    if (!isNaN(Number(s))) return `${s}'`;
    
    // Si tenemos el minuto por parámetro
    if (currentMinute) return `${currentMinute}'`;

    return 'LIVE';
  }

  // Si terminó hoy
  if (s === 'FT' || s === 'AET' || s === 'PEN') {
    return '✓';
  }

  return null;
};

