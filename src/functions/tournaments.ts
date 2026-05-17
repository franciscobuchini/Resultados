/**
 * Determina si el torneo A es más reciente que el torneo B
 * Basado en formato: PREFIJO.AÑO.SUFIJO (Ej: ARG.2023.11, ARG.2016-17.11)
 */
export const isNewerTournament = (idA: string, idB: string): boolean => {
  const pA = idA.split('.')
  const pB = idB.split('.')
  if (pA.length < 3 || pB.length < 3) return idA > idB // Fallback
  
  // Comparar los años (ej: "2016" o "2016-17")
  const yearsA = pA[1].split(/[-_]/).map(Number)
  const yearsB = pB[1].split(/[-_]/).map(Number)
  
  if (yearsA[0] !== yearsB[0]) return yearsA[0] > yearsB[0]
  
  const subYearA = yearsA.length > 1 ? yearsA[1] : 0
  const subYearB = yearsB.length > 1 ? yearsB[1] : 0
  if (subYearA !== subYearB) return subYearA > subYearB
  
  // Si los años son exactos, compara la edición final (ej: "12" > "11")
  return pA[2] > pB[2]
}

/**
 * Agrupa una lista de torneos por su "base" (Prefijo + 1ra letra sufijo)
 * y devuelve solo la edición más reciente de cada base, ordenada alfabéticamente.
 */
export const groupLatestTournaments = (
  tournaments: { tournament_id: string; tournament_name: string }[]
): { id: string; name: string }[] => {
  const latestEditions = new Map<string, { id: string, name: string }>()

  tournaments.forEach(t => {
    const parts = t.tournament_id.split('.')
    if (parts.length >= 3) {
      // El torneo base se define por el Prefijo + la 1er letra del sufijo (Ej: ARG1, INTW)
      const baseKey = parts[0] + parts[2][0]
      
      const existing = latestEditions.get(baseKey)
      if (!existing || isNewerTournament(t.tournament_id, existing.id)) {
        latestEditions.set(baseKey, { id: t.tournament_id, name: t.tournament_name })
      }
    }
  })

  // Convertir el mapa en el array final, ordenado alfabéticamente
  return Array.from(latestEditions.values()).sort((a, b) => a.name.localeCompare(b.name))
}
