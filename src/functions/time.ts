import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

// ============================================================
// STORE — Estado global de zona horaria
// ============================================================

interface TimeState {
  utcOffset: number;
  setUtcOffset: (offset: number) => void;
}

export const useTime = create<TimeState>()(
  persist(
    (set) => ({
      utcOffset: -3, // Default Argentina
      setUtcOffset: (offset: number) => set({ utcOffset: offset }),
    }),
    {
      name: 'utc-offset-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

// ============================================================
// CONVERSIÓN CENTRAL — Una sola función para todo
// ============================================================

/**
 * Resultado de convertir una fecha/hora UTC a la zona local del usuario.
 */
export interface LocalTime {
  /** Hora local formateada "HH:mm" */
  time: string;
  /** Fecha local "YYYY-MM-DD" */
  date: string;
  /** Objeto Date ajustado a la zona local */
  dateObj: Date;
  /** Timestamp en milisegundos (útil para ordenar cronológicamente) */
  timestamp: number;
}

/**
 * toLocal — Convierte fecha + hora UTC a la zona horaria seleccionada por el usuario.
 * 
 * Esta es LA ÚNICA función que necesitás para convertir horarios.
 * Maneja automáticamente el cambio de día (ej: 23:00 UTC + offset -3 = 20:00 mismo día,
 * o 02:00 UTC + offset -3 = 23:00 del día anterior).
 *
 * @param matchDate  - Fecha UTC del partido "YYYY-MM-DD" (como viene de la DB)
 * @param matchTime  - Hora UTC del partido "HH:mm" (como viene de la DB)
 * @param offset     - Offset UTC del usuario (ej: -3 para Argentina, -4 para Este USA)
 * 
 * @example
 * const local = toLocal('2026-06-11', '19:00', -4);
 * // local.time = '15:00'
 * // local.date = '2026-06-11'
 */
export function toLocal(matchDate: string | null, matchTime: string | null, offset: number): LocalTime {
  // Fallback si faltan datos
  if (!matchDate || !matchTime) {
    return { time: '--:--', date: matchDate || '', dateObj: new Date(), timestamp: 0 };
  }

  try {
    const [year, month, day] = matchDate.split('-').map(Number);
    const [hour, minute] = matchTime.split(':').map(Number);

    // Crear fecha en UTC real
    const utcDate = new Date(Date.UTC(year, month - 1, day, hour, minute));
    
    // Aplicar offset (en milisegundos)
    const localDate = new Date(utcDate.getTime() + offset * 3600000);

    // Formatear resultado
    const hh = String(localDate.getUTCHours()).padStart(2, '0');
    const mm = String(localDate.getUTCMinutes()).padStart(2, '0');

    return {
      time: `${hh}:${mm}`,
      date: localDate.toISOString().split('T')[0],
      dateObj: localDate,
      timestamp: localDate.getTime(),
    };
  } catch {
    return { time: matchTime, date: matchDate, dateObj: new Date(), timestamp: 0 };
  }
}

// ============================================================
// HOOK — Para usar directamente en componentes React
// ============================================================

/**
 * useLocalTime — Hook que convierte fecha/hora UTC usando el offset global.
 * 
 * @example
 * const { time, date } = useLocalTime('2026-06-11', '19:00');
 * // Si el usuario tiene UTC-4: time='15:00', date='2026-06-11'
 */
export function useLocalTime(matchDate: string | null, matchTime: string | null): LocalTime {
  const { utcOffset } = useTime();
  return toLocal(matchDate, matchTime, utcOffset);
}
