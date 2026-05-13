// ============================================================
// Match — tipo que refleja la tabla matches de Supabase
// ============================================================

export interface Match {
  match_id: string
  match_date: string | null
  match_time_utc: string | null
  match_status: string | null
  match_round: string | null
  home_id: string | null
  home_name: string | null
  home_score: number | null
  home_penalty: number | null
  away_id: string | null
  away_name: string | null
  away_score: number | null
  away_penalty: number | null
  tournament_id: string | null
}

export interface Goal {
  goal_id: string
  match_id: string
  team_id: string
  goal_minute: number | null
  player_name: string
  goal_type: string // 'G' = normal, 'P' = penalty, 'C' = own goal
}