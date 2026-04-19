import { useEffect, useState } from 'react'
import { supabase } from './functions/supabaseClient'

export default function App() {
  const [games, setGames] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('matches')
      .select('*')
      .order('match_date', { ascending: false })
      .then((res) => {
        if (res.data) setGames(res.data)
        setLoading(false)
      })
  }, [])

  if (loading) return (
    <div className="bg-black text-white h-screen p-10 font-mono text-lg animate-pulse">
      Conectando a base de datos...
    </div>
  )

  return (
    <div className="bg-black text-white min-h-screen font-mono text-xs">
      <table className="w-full border-collapse border border-gray-600">
        <thead>
          <tr className="bg-zinc-800 border-b border-gray-600">
            <th className="th-base w-[60px]">ID</th>
            <th className="th-base w-[60px]">API_ID</th>
            <th className="th-base w-[60px]">T_ID</th>
            <th className="th-base w-[100px]">FECHA</th>
            <th className="th-base w-[150px]">FASE</th>
            <th className="th-base text-center w-[100px]">STATUS</th>
            <th className="th-base w-[60px]">ESTADIO</th>
            <th className="th-base text-right pr-2 w-[40px]">ID_H</th>
            <th className="th-base text-right pr-2 w-[200px]">HOME</th>
            <th className="th-base text-center w-[40px]">H_S</th>
            <th className="th-base text-center w-[40px]">A_S</th>
            <th className="th-base pl-2 w-[200px]">AWAY</th>
            <th className="th-base pl-2 border-r-0 w-[40px]">ID_A</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10">
          {games.map(g => {
            const time = new Date(g.match_date).toLocaleString('es-AR', {
              month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit',
              timeZone: 'America/Argentina/Buenos_Aires', hour12: false
            })
            const fH = (s: any, p: any) => (s === null) ? '-' : (p !== null ? `${s} (${p})` : s)
            const fA = (s: any, p: any) => (s === null) ? '-' : (p !== null ? `(${p}) ${s}` : s)

            return (
              <tr key={g.match_id} className="hover:bg-zinc-900 border-white/5">
                <td className="td-base text-gray-500">{g.match_id.split('-')[0]}</td>
                <td className="td-base">{g.match_id_api}</td>
                <td className="td-base">{g.tournament_id}</td>
                <td className="td-base whitespace-nowrap">{time}</td>
                <td className="td-base text-gray-500 max-w-[100px]">{g.stage_name || '-'}</td>
                <td className="td-base text-center font-bold">{g.match_status}</td>
                <td className="td-base text-gray-500 max-w-[80px]">{g.stadium_name || '-'}</td>
                <td className="td-base text-right pr-2 text-gray-400">{g.home_team_id}</td>
                <td className="td-base text-right pr-2 font-bold max-w-[120px]">{g.home_team_name}</td>
                <td className="td-base text-center font-bold">{fH(g.home_score, g.home_penalty_score)}</td>
                <td className="td-base text-center font-bold">{fA(g.away_score, g.away_penalty_score)}</td>
                <td className="td-base pl-2 font-bold max-w-[120px]">{g.away_team_name}</td>
                <td className="td-base pl-2 text-gray-400 border-r-0">{g.away_team_id}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
