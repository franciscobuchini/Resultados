// Lógica de conversión universal para todo el proyecto
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

export const adjustDateWithOffset = (date: Date, offset: number) => {
  // Simplemente sumamos las horas al timestamp UTC
  return new Date(date.getTime() + (offset * 3600000));
}
