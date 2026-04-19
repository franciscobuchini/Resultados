import { useEffect, useState } from 'react'
import { supabase } from './functions/supabaseClient'

export default function App() {
  const [datos, setDatos] = useState<any>(null)

  useEffect(() => {
    supabase.from('apis').select('*').then(res => setDatos(res.data))
  }, [])

  return <pre>{JSON.stringify(datos, null, 2)}</pre>
}


