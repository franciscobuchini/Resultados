import { useEffect, useState } from 'react'
import { supabase } from '../../functions/supabase'
import { useTime, toLocal } from '../../functions/time'
import { useThemeClasses } from '../../functions/themeStore'
import { RefreshCw } from 'lucide-react'

export default function SyncStatus() {
  const [lastSync, setLastSync] = useState('')
  const [loading, setLoading] = useState(false)
  const { utcOffset } = useTime()
  const { textMuted, textMain } = useThemeClasses()

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
  }, [utcOffset])

  return (
    <div className="flex items-center gap-2 w-full justify-center">
      <RefreshCw size={16} className={textMuted} />
      <span className={`text-sm ${textMuted}`}>Sincronización:</span>
      <span className={`text-sm font-medium ${textMain}`}>{loading ? '--/-- --:--' : lastSync || '--/-- --:--'}</span>
    </div>
  )
}
