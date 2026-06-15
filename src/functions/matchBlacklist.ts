import { supabase } from './supabase'

export interface BlacklistedMatch {
  id: number
  match_id: number
  created_at: string
  created_by: string | null
  reason: string | null
}

/**
 * Obtiene todos los match IDs que están en la blacklist
 */
export async function getBlacklistedMatchIds(): Promise<number[]> {
  const { data, error } = await supabase
    .from('match_blacklist')
    .select('match_id')

  if (error) {
    console.error('Error fetching blacklist:', error)
    return []
  }

  return data?.map(item => item.match_id) || []
}

/**
 * Agrega un match ID a la blacklist
 */
export async function addToBlacklist(matchId: number, reason?: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser()
  
  const { error } = await supabase
    .from('match_blacklist')
    .insert({
      match_id: matchId,
      created_by: user?.id || null,
      reason: reason || null
    })

  if (error) {
    console.error('Error adding to blacklist:', error)
    return false
  }

  return true
}

/**
 * Remueve un match ID de la blacklist
 */
export async function removeFromBlacklist(matchId: number): Promise<boolean> {
  const { error } = await supabase
    .from('match_blacklist')
    .delete()
    .eq('match_id', matchId)

  if (error) {
    console.error('Error removing from blacklist:', error)
    return false
  }

  return true
}

/**
 * Verifica si un match ID está en la blacklist
 */
export async function isMatchBlacklisted(matchId: number): Promise<boolean> {
  const { data, error } = await supabase
    .from('match_blacklist')
    .select('match_id')
    .eq('match_id', matchId)
    .single()

  if (error || !data) {
    return false
  }

  return true
}

/**
 * Obtiene todos los registros de la blacklist con detalles
 */
export async function getBlacklistEntries(): Promise<BlacklistedMatch[]> {
  const { data, error } = await supabase
    .from('match_blacklist')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching blacklist entries:', error)
    return []
  }

  return data || []
}
