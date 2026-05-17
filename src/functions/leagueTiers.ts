/**
 * Define el nivel de importancia de una liga para ordenarlas en la pantalla principal.
 * El orden en esta lista determina la prioridad (el que está más arriba aparece primero).
 * Si una liga no está en la lista, recibe la prioridad más baja automáticamente.
 * 
 * NOTA: Puedes agregar los nombres exactos o parciales de las ligas que trae la API.
 */
const TIER_LIST: string[] = [
  // Top absolutos
  'MUNDIAL',
  'COPA AMÉRICA',
  
  // Argentina
  'LIGA PROFESIONAL DE FÚTBOL',
  'COPA ARGENTINA',
  'COPA DE LA LIGA',

  // Ascenso Argentina
  'PRIMERA B NACIONAL',
  'PRIMERA B METROPOLITANA',
  'PRIMERA C',
  'PRIMERA D',
  
  // Internacionales principales
  'COPA LIBERTADORES',
  'COPA SUDAMERICANA',
  'CHAMPIONS LEAGUE',
  'EUROPA LEAGUE',
  
  // Internacionales Top
  'PREMIER LEAGUE',
  'LA LIGA',
  'SERIE A',
  'BUNDESLIGA',
  'BRASILEIRAO',
  'MAJOR LEAGUE SOCCER',
  'LIGUE 1',

  // Copas de otros países
  'AMISTOSO INTERNACIONAL',
  'FA CUP',
  'COPA DEL REY',
  'COPA DO BRASIL',
];

export const getLeaguePriority = (leagueName: string): number => {
  // 1. Búsqueda exacta primero
  const exactIndex = TIER_LIST.indexOf(leagueName);
  if (exactIndex !== -1) return exactIndex;

  // 2. Búsqueda por coincidencia parcial (ej: "UEFA Champions League" -> matchea con "Champions League")
  const partialIndex = TIER_LIST.findIndex(key => 
    leagueName.toLowerCase().includes(key.toLowerCase())
  );
  
  if (partialIndex !== -1) return partialIndex;

  // 3. Si no se encuentra, prioridad por defecto (al final de todo)
  return 999;
}
