import { useEffect, useState } from 'react'
import { supabase } from './functions/supabaseClient'
import SyncStatus from './components/SyncStatus'

interface Match {
  match_id: string
  match_id_api: number
  tournament_id: number
  match_date: string
  stage_name: string | null
  match_status: string
  stadium_name: string | null
  home_team_id: string
  home_team_name: string
  home_penalty_score: number | null
  home_score: number | null
  away_score: number | null
  away_penalty_score: number | null
  away_team_name: string
  away_team_id: string
}

interface Team {
  team_id: string
  team_id_api: number
  team_name: string
  team_fullname: string
  team_shortname: string
  team_nickname: string
  team_stadium: string | null
  team_city: string | null
  team_country_id: string | null
  team_crest_url: string | null
  team_color: string | null
}

const PAGE_SIZE = 100

export default function App() {
  const [games, setGames] = useState<Match[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [lastSync, setLastSync] = useState('')
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const from = page * PAGE_SIZE
      const to = from + PAGE_SIZE - 1

      try {
        const [resGames, resSync, resTeams] = await Promise.all([
          supabase.from('matches').select('*').order('match_date', { ascending: false }).range(from, to),
          supabase.from('apis').select('updated_at').order('updated_at', { ascending: false }).limit(1),
          supabase.from('teams').select('*').order('team_name', { ascending: true })
        ])

        if (resGames.data) setGames(resGames.data)
        if (resSync.data?.[0]) setLastSync(new Date(resSync.data[0].updated_at).toLocaleTimeString())
        if (resTeams.data) setTeams(resTeams.data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [page])

  const fDate = (d: string) => new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, ' ')
  const fScore = (s: number | null, p: number | null) => s === null ? '-' : (p !== null ? `${s}(${p})` : s)

  return (
    <div className="bg-zinc-950 text-zinc-300 min-h-screen font-mono text-[10px] p-4">
      
      <div className="max-w-[1600px] mx-auto space-y-10">
        
        {/* HEADER */}
        <header className="flex justify-between items-center border-b border-zinc-900 pb-4">
          <h1 className="text-white font-bold text-lg tracking-tight">RESULTADOS AR</h1>
          <div className="flex gap-6 items-center font-bold">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="hover:text-white text-zinc-600 disabled:opacity-20 cursor-pointer transition-colors ">Anterior</button>
            <span className="text-emerald-500 ">Página {page + 1}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={games.length < PAGE_SIZE} className="hover:text-white text-zinc-600 disabled:opacity-20 cursor-pointer transition-colors ">Siguiente</button>
          </div>
        </header>

        {/* TABLA DE PARTIDOS */}
        <section>
          <h2 className="text-zinc-500 font-bold  mb-2 tracking-widest text-[9px]">Partidos</h2>
          <div className="overflow-x-auto border border-zinc-900 rounded bg-zinc-900/10">
            <table className="w-full text-left border-collapse">
              <thead className="bg-zinc-900 text-zinc-400  text-[9px]">
                <tr className="border-b border-zinc-800">
                  <th className="p-2 border-r border-zinc-800 w-20">ID (API)</th>
                  <th className="p-2 border-r border-zinc-800 text-emerald-400 w-24">Fecha</th>
                  <th className="p-2 border-r border-zinc-800">Fase</th>
                  <th className="p-2 border-r border-zinc-800 w-20 text-center">Estado</th>
                  <th className="p-2 border-r border-zinc-800 text-right">Local</th>
                  <th className="p-2 border-r border-zinc-800 text-center bg-zinc-800 text-white min-w-[70px]">Score</th>
                  <th className="p-2 border-r border-zinc-800">Visitante</th>
                  <th className="p-2 border-r border-zinc-800">Estadio</th>
                  <th className="p-2 border-r border-zinc-800">T_ID</th>
                  <th className="p-2">UUID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {games.map(g => {
                  const isLive = g.match_status.includes("'") || g.match_status === 'ET';
                  const matchDate = new Date(g.match_date);
                  const today = new Date();
                  const isToday = matchDate.getDate() === today.getDate() && 
                                  matchDate.getMonth() === today.getMonth() && 
                                  matchDate.getFullYear() === today.getFullYear();

                  return (
                  <tr key={g.match_id} className="hover:bg-zinc-900/50 transition-colors group text-zinc-400">
                    <td className="p-2 border-r border-zinc-900 font-bold text-white bg-zinc-900/20">{g.match_id_api}</td>
                    <td className={`p-2 border-r border-zinc-900 font-bold whitespace-nowrap ${isToday ? 'text-emerald-400' : 'text-zinc-100'}`}>
                      {fDate(g.match_date)}
                    </td>
                    <td className="p-2 border-r border-zinc-900 truncate max-w-[100px]">{g.stage_name || '-'}</td>
                    <td className={`p-2 border-r border-zinc-900 font-black text-center ${isLive ? 'text-red-500 animate-pulse' : (isToday ? 'text-emerald-400' : 'text-zinc-500')}`}>
                      {g.match_status}
                    </td>
                    <td className="p-2 border-r border-zinc-900 text-right font-bold text-white ">{g.home_team_name}</td>
                    <td className={`p-2 border-r border-zinc-900 text-center bg-zinc-800/10 font-black text-[11px] ${isLive ? 'text-red-500' : 'text-emerald-400'}`}>
                      {fScore(g.home_score, g.home_penalty_score)} : {fScore(g.away_score, g.away_penalty_score)}
                    </td>
                    <td className="p-2 border-r border-zinc-900 font-bold text-white ">{g.away_team_name}</td>
                    <td className="p-2 border-r border-zinc-900 truncate max-w-[140px]  font-light text-zinc-500">{g.stadium_name || '-'}</td>
                    <td className="p-2 border-r border-zinc-900 text-zinc-700">{g.tournament_id}</td>
                    <td className="p-2 text-zinc-800 italic">{g.match_id.split('-')[0]}</td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* TABLA DE EQUIPOS */}
        <section>
          <h2 className="text-zinc-500 font-bold  mb-2 mt-8 tracking-widest text-[9px]">Directorio de Equipos</h2>
          <div className="overflow-x-auto border border-zinc-900 rounded bg-zinc-900/10 mb-10">
            <table className="w-full text-left border-collapse">
              <thead className="bg-zinc-900 text-zinc-400  text-[9px]">
                <tr className="border-b border-zinc-800">
                  <th className="p-2 border-r border-zinc-800 w-20">ID (API)</th>
                  <th className="p-2 border-r border-zinc-800 text-emerald-400">Nombre</th>
                  <th className="p-2 border-r border-zinc-800">Nombre Completo</th>
                  <th className="p-2 border-r border-zinc-800 text-center w-10">Color</th>
                  <th className="p-2 border-r border-zinc-800">Apodo</th>
                  <th className="p-2 border-r border-zinc-800">Estadio</th>
                  <th className="p-2 border-r border-zinc-800">Ciudad</th>
                  <th className="p-2 border-r border-zinc-800 text-center w-12">Corto</th>
                  <th className="p-2 border-r border-zinc-800 text-center w-12">País</th>
                  <th className="p-2">UUID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {teams.map(t => (
                  <tr key={t.team_id} className="hover:bg-zinc-900/50 transition-colors text-zinc-400">
                    <td className="p-2 border-r border-zinc-900 font-bold text-white bg-zinc-900/20">{t.team_id_api}</td>
                    <td className="p-2 border-r border-zinc-900 font-black text-white">{t.team_name}</td>
                    <td className="p-2 border-r border-zinc-900 text-zinc-300  tracking-tight">{t.team_fullname || '-'}</td>
                    <td className="p-2 border-r border-zinc-900 text-center">
                      <div className="w-full h-3 rounded-sm border border-white/10" style={{ backgroundColor: t.team_color || '#111' }} />
                    </td>
                    <td className="p-2 border-r border-zinc-900 text-emerald-400 italic lowercase">{t.team_nickname || '-'}</td>
                    <td className="p-2 border-r border-zinc-900 truncate max-w-[120px]  text-zinc-500">{t.team_stadium || '-'}</td>
                    <td className="p-2 border-r border-zinc-900  text-zinc-500">{t.team_city || '-'}</td>
                    <td className="p-2 border-r border-zinc-900 text-center font-black text-zinc-100">{t.team_shortname}</td>
                    <td className="p-2 border-r border-zinc-900 text-center text-zinc-600 font-bold">{t.team_country_id || '-'}</td>
                    <td className="p-2 text-zinc-800 italic">{t.team_id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <SyncStatus lastSync={lastSync} loading={loading} />
      </div>
    </div>
  )
}
