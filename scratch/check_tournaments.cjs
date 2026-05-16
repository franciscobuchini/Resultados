const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://yngltjlglxlpfjawtxpp.supabase.co'
const supabaseKey = 'sb_publishable_SVRK686G2QaSxPc3lf5UCg_CKVDwnUV'

const supabase = createClient(supabaseUrl, supabaseKey)

async function check() {
  const { data, error } = await supabase
    .from('tournaments')
    .select('tournament_id, tournament_name')
    .ilike('tournament_id', 'ARG.%')
  
  if (error) {
    console.error(error)
    return
  }
  
  console.log('Found:', data.length)
  console.log(JSON.stringify(data, null, 2))
}

check()
