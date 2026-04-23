import { useEffect, useState } from 'react'
import { supabase } from '../functions/supabaseClient'
import { formatTimeWithOffset } from '../utils/time'
import { useTime } from '../contexts/TimeContext'

interface Match {
  match_id: string;
  match_date: string;
  match_time_utc: string;
  match_status: string;
  game_time: number;
  home_id: string;
  home_name: string;
  home_score: number | null;
  away_id: string;
  away_name: string;
  away_score: number | null;
  tournament_id: string;
  match_round: string;
  [key: string]: string | number | null; // Tipos específicos permitidos
}

const PAGE_SIZE = 100

export default function AllMatchesTable() {
  const { utcOffset } = useTime()
  const [data, setData] = useState<Match[]>([])
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    const fetchData = async () => {
      const from = page * PAGE_SIZE
      const to = from + PAGE_SIZE - 1

      const { data: matches, count } = await supabase
        .from('matches')
        .select('*', { count: 'exact' })
        .order('match_date', { ascending: false })
        .range(from, to)
      
      if (matches) setData(matches)
      if (count !== null) setTotal(count)
    }

    fetchData()

    // Suscribirse a cambios en tiempo real
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'matches' },
        () => {
          fetchData() // Recargar datos cuando algo cambie
        }
      )
      .subscribe()

    // 2. Polling de respaldo cada 60s
    const interval = setInterval(fetchData, 60000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(interval)
    }
  }, [page])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  const getMatchInfo = (row: Match) => {
    const status = row.match_status?.toLowerCase() || ''
    const gameTime = row.game_time
    const matchDate = row.match_date
    const today = new Date().toISOString().split('T')[0]
    
    if (status.includes('final') || status.includes('term')) return row.match_status
    if (status.includes('descanso') || status.includes('entretiempo') || status.includes('half time')) return 'Entretiempo'

    if (gameTime > 0) {
      // Formato 45+X' para el primer tiempo
      if (gameTime > 45 && (status.includes('1') || status.includes('primero') || status.includes('1st'))) {
        return `45'+${gameTime - 45}'`
      }
      // Formato 90+X' para el segundo tiempo
      if (gameTime > 90 && (status.includes('2') || status.includes('segundo') || status.includes('2nd'))) {
        return `90'+${gameTime - 90}'`
      }
      return `${gameTime}'`
    }

    const time = formatTimeWithOffset(row.match_time_utc, utcOffset)
    if (matchDate === today) return time
    const [, mm, dd] = matchDate.split('-')
    return `${dd}/${mm} ${time}`
  }

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
      <div className="flex items-center justify-between mb-4 px-2">
        <h2 className="text-zinc-500 text-xs font-mono uppercase">Partidos</h2>
        <div className="flex items-center gap-3">
          <span className="text-zinc-600 text-[10px] font-mono">{total} total</span>
          <button onClick={() => setPage(p => p - 1)} disabled={page === 0}
            className="px-2 py-1 text-[10px] font-mono bg-zinc-800 text-zinc-400 rounded hover:bg-zinc-700 disabled:text-zinc-700 disabled:cursor-not-allowed transition-colors">
            ← Prev
          </button>
          <span className="text-[10px] font-mono text-zinc-500">{page + 1}/{totalPages}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}
            className="px-2 py-1 text-[10px] font-mono bg-zinc-800 text-zinc-400 rounded hover:bg-zinc-700 disabled:text-zinc-700 disabled:cursor-not-allowed transition-colors">
            Next →
          </button>
        </div>
      </div>
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
                    <div className="flex items-center justify-center gap-2">
                      {displayValue === null ? <span className="text-zinc-700">null</span> : String(displayValue)}
                      {col === 'match_id' && row.match_notes && (
                        <span 
                          className="text-amber-400 cursor-help font-bold animate-pulse" 
                          title={String(row.match_notes)}
                        >
                          !
                        </span>
                      )}
                    </div>
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
