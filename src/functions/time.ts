import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

// --- ESTADO GLOBAL (STORE) ---
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

// --- LÓGICA DE CONVERSIÓN (HELPERS) ---

// Formatea un string "HH:mm" sumándole el offset
export const formatTimeWithOffset = (timeStr: string, offset: number) => {
  if (!timeStr) return '--:--'
  try {
    const [h, m] = timeStr.split(':').map(Number)
    let newH = (h + offset) % 24
    if (newH < 0) newH += 24
    const hh = String(newH).padStart(2, '0')
    const mm = String(m).padStart(2, '0')
    return `${hh}:${mm}`
  } catch { return timeStr }
}

// Ajusta un objeto Date sumándole las horas del offset
export const adjustDateWithOffset = (date: Date, offset: number) => {
  return new Date(date.getTime() + (offset * 3600000));
}
