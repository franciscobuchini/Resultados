import { useEffect, useState } from 'react'
import { supabase } from '../functions/supabaseClient'

export default function SyncStatus() {
  const [lastSync, setLastSync] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const { data } = await supabase
          .from('apis')
          .select('updated_at')
          .order('updated_at', { ascending: false })
          .limit(1)

        if (data?.[0]) {
          const date = new Date(data[0].updated_at)
          const dateStr = date.toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' })
          const timeStr = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false })
          setLastSync(`${dateStr} ${timeStr}`)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 60000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="bg-zinc-900 border border-zinc-700 px-4 py-2 rounded-full flex items-center gap-3 shadow-2xl">
      <div className="flex items-center">
        <span className="text-sm text-green-400">{loading ? 'Sincronizando...' : 'Sincronizado'}</span>
        <span className="ml-2 w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
      </div>
      <span className="text-sm text-white font-bold">{lastSync || '--/-- --:--'}</span>
    </div>
  )
}
