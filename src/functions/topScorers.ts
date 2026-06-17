import { supabase } from './supabase'

const TOP_SCORERS_ID = 'topscorers_worldcup'

export interface TopScorer {
  nombre: string
  goles: number
  country_id: string
}

/**
 * Lee el array de goleadores desde la tabla apis
 */
export async function getTopScorers(): Promise<TopScorer[]> {
  const { data, error } = await supabase
    .from('apis')
    .select('data')
    .eq('id', TOP_SCORERS_ID)
    .maybeSingle()

  if (error) {
    console.error('Error fetching top scorers:', error)
    return []
  }

  if (data?.data && Array.isArray(data.data)) {
    return data.data as TopScorer[]
  }

  return []
}
