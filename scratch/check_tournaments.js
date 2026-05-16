import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function check() {
  const { data, error } = await supabase
    .from('tournaments')
    .select('tournament_id, tournament_name')
    .ilike('tournament_id', 'INT.%WC')
  
  if (error) {
    console.error(error)
    return
  }
  
  console.log('Found:', data.length)
  console.log(JSON.stringify(data, null, 2))
}

check()
