import { useEffect, useState } from 'react'
import { supabase } from '../functions/supabaseClient'
import { useTime } from '../contexts/TimeContext'
import { adjustDateWithOffset } from '../utils/time'

export default function SyncStatus() {
  const [lastSync, setLastSync] = useState('')
  const [loading, setLoading] = useState(false)
  const { utcOffset } = useTime()

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
          const rawDate = new Date(data[0].updated_at)
          // Ajustamos la fecha al offset global
          const adjustedDate = adjustDateWithOffset(rawDate, utcOffset)
          
          const dateStr = adjustedDate.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' })
          const timeStr = adjustedDate.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' })
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
  }, [utcOffset]) // Dependemos del offset para refrescar el string

  return (
    <div className="bg-zinc-900 border border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800 px-3 sm:px-4 h-8 sm:h-10 rounded-full flex items-center gap-2 transition-all shadow-2xl cursor-default font-mono">
      <div className="flex items-center">
        <span className="text-[10px] sm:text-xs text-green-400">
          {loading ? '...' : (
            <>
              <span className="hidden sm:inline">Sincronizado</span>
              <span className="sm:hidden">SYNC</span>
            </>
          )}
        </span>
        <span className="ml-1.5 sm:ml-2 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-400 animate-pulse"></span>
      </div>
      <span className="text-[10px] sm:text-xs text-white font-bold">{lastSync || '--/-- --:--'}</span>
    </div>
  )
}
