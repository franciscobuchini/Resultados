import { useEffect, useState } from 'react'
import { supabase } from '../../functions/supabase'
import { useTime, toLocal } from '../../functions/time'
import { useThemeClasses } from '../../functions/themeStore'

export default function SyncStatus() {
  const [lastSync, setLastSync] = useState('')
  const [loading, setLoading] = useState(false)
  const { utcOffset } = useTime()
  const { textDimmed, textMuted } = useThemeClasses()

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
          // Extraer fecha y hora UTC del timestamp de sincronización
          const utcDate = rawDate.toISOString().split('T')[0];
          const utcTime = `${String(rawDate.getUTCHours()).padStart(2, '0')}:${String(rawDate.getUTCMinutes()).padStart(2, '0')}`;
          const local = toLocal(utcDate, utcTime, utcOffset);
          
          const [, mo, d] = local.date.split('-');
          setLastSync(`${d}/${mo} ${local.time}`)
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
    <div className="flex items-center gap-1 font-mono text-[10px] sm:text-xs">
      <span className={`${textDimmed} uppercase tracking-widest`}>Sync:</span>
      <span className={textMuted}>{loading ? '...' : lastSync || '--/-- --:--'}</span>
    </div>
  )
}
