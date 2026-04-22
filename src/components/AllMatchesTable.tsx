import { useEffect, useState } from 'react'
import { supabase } from '../functions/supabaseClient'

interface AllMatchesTableProps {
  utcOffset: number;
}

export default function AllMatchesTable({ utcOffset }: AllMatchesTableProps) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const { data: matches } = await supabase
        .from('matches')
        .select('*')
        .order('match_date', { ascending: false })
      
      if (matches) setData(matches)
      setLoading(false)
    }
    fetchData()
  }, [])

  const formatTimeWithOffset = (timeStr: string, offset: number) => {
    if (!timeStr) return '--:--'
    try {
      const [h, m] = timeStr.split(':').map(Number)
      const date = new Date()
      date.setUTCHours(h, m, 0)
      date.setHours(date.getHours() + offset)
      return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false })
    } catch (e) { return timeStr }
  }

  const getMatchInfo = (row: any) => {
    const status = row.match_status?.toLowerCase() || ''
    const gameTime = row.game_time
    const matchDate = row.match_date
    const today = new Date().toISOString().split('T')[0]
    
    if (status.includes('final') || status.includes('term')) return row.match_status
    if (gameTime > 0 && !status.includes('final')) return `${gameTime}'`

    const time = formatTimeWithOffset(row.match_time_utc, utcOffset)
    if (matchDate === today) return time
    const [_, mm, dd] = matchDate.split('-')
    return `${dd}/${mm} ${time}`
  }

  if (loading) return <div className="p-4 text-zinc-100">Cargando partidos...</div>

  const columns = [
    'tournament_id',
    'match_round',
    'match_id',
    'home_id',
    'home_name',
    'home_score',
    'away_score',
    'away_name',
    'away_id',
    'status'
  ]

  return (
    <div className="p-4 overflow-x-auto pb-8 text-center">
      <h2 className="text-zinc-500 text-xs font-mono uppercase mb-4 text-left px-2">Partidos</h2>
      <table className="w-full border-collapse text-[10px] font-mono bg-black text-zinc-400 min-w-max">
        <thead>
          <tr className="bg-neutral-950 sticky top-0">
            {columns.map(col => (
              <th key={col} className="border border-zinc-800 p-2 text-center text-sm text-zinc-100 uppercase">{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="hover:bg-zinc-900 transition-colors">
              {columns.map(col => {
                let displayValue = row[col]
                
                if (col === 'status') {
                  displayValue = getMatchInfo(row)
                }

                return (
                  <td key={col} className={`border border-zinc-800 p-2 whitespace-nowrap text-zinc-300 ${col === 'status' ? 'text-green-400 font-bold' : ''}`}>
                    {displayValue === null ? <span className="text-zinc-700">null</span> : String(displayValue)}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
