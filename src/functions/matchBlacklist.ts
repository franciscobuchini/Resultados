import { supabase } from './supabase'

const BLACKLIST_ID = 'match_blacklist'

export interface BlacklistEntry {
  match_id: number
  teams: string
  date: string
}

/**
 * Lee el array de blacklist desde la tabla apis
 */
async function readBlacklistData(): Promise<BlacklistEntry[]> {
  const { data, error } = await supabase
    .from('apis')
    .select('data')
    .eq('id', BLACKLIST_ID)
    .maybeSingle()

  if (error) {
    console.error('Error fetching blacklist:', error)
    return []
  }

  if (data?.data && Array.isArray(data.data)) {
    return data.data as BlacklistEntry[]
  }

  return []
}

/**
 * Guarda el array de blacklist en la tabla apis
 */
async function writeBlacklistData(entries: BlacklistEntry[]): Promise<boolean> {
  const { error } = await supabase
    .from('apis')
    .upsert(
      { id: BLACKLIST_ID, data: entries, updated_at: new Date().toISOString() },
      { onConflict: 'id' }
    )

  if (error) {
    console.error('Error saving blacklist:', error)
    return false
  }

  return true
}

/**
 * Obtiene todos los match IDs que están en la blacklist
 */
export async function getBlacklistedMatchIds(): Promise<number[]> {
  const entries = await readBlacklistData()
  return entries.map(item => item.match_id)
}

/**
 * Agrega un match a la blacklist
 */
export async function addToBlacklist(matchId: number, teams: string, date: string): Promise<boolean> {
  const entries = await readBlacklistData()

  // Evitar duplicados
  if (entries.some(e => e.match_id === matchId)) {
    return true
  }

  const newEntry: BlacklistEntry = {
    match_id: matchId,
    teams,
    date
  }

  return writeBlacklistData([...entries, newEntry])
}

/**
 * Remueve un match ID de la blacklist
 */
export async function removeFromBlacklist(matchId: number): Promise<boolean> {
  const entries = await readBlacklistData()
  const filtered = entries.filter(e => e.match_id !== matchId)
  return writeBlacklistData(filtered)
}
