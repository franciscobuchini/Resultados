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
    const fetchData = async (isSilent = false) => {
      if (!isSilent) setLoading(true)
      const from = page * PAGE_SIZE
      const to = from + PAGE_SIZE - 1
  
      try {
        const [resGames, resSync, resTeams] = await Promise.all([
          supabase.from('matches').select('*').order('match_date', { ascending: false }).range(from, to),
          supabase.from('apis').select('updated_at').order('updated_at', { ascending: false }).limit(1),
          supabase.from('teams').select('*').order('team_name', { ascending: true })
        ])
  
        if (resGames.data) setGames(resGames.data)
        if (resSync.data?.[0]) {
          setLastSync(new Date(resSync.data[0].updated_at).toLocaleTimeString('es-AR', { 
            hour: '2-digit', 
            minute: '2-digit', 
            hour12: false 
          }))
        }
        if (resTeams.data) setTeams(resTeams.data)
      } catch (err) {
        console.error(err)
      } finally {
        if (!isSilent) setLoading(false)
      }
    }

    fetchData()
    const interval = setInterval(() => fetchData(true), 60000) // Refresca cada 60 segundos en silencio

    return () => clearInterval(interval)
  }, [page])

  const fDate = (d: string) => new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, ' ')
  const fScore = (s: number | null, p: number | null) => s === null ? '-' : (p !== null ? `${s}(${p})` : s)

  return (
    <div className="bg-zinc-950 text-zinc-100 min-h-screen font-mono text-[9px] p-2 selection:bg-emerald-500/30">
      
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        {/* HEADER ULTRA SIMPLIFICADO */}
        <header className="flex justify-start items-center gap-4 text-white font-bold uppercase tracking-tighter py-2 border-b border-zinc-900">
          <span>Resultados</span>
          <div className="flex items-center gap-3 text-emerald-500">
            <button 
              onClick={() => setPage(p => Math.max(0, p - 1))} 
              disabled={page === 0} 
              className="hover:text-white cursor-pointer disabled:opacity-10 transition-colors"
            >
              &lt;
            </button>
            <span className="text-zinc-500">{page + 1}</span>
            <button 
              onClick={() => setPage(p => p + 1)} 
              disabled={games.length < PAGE_SIZE} 
              className="hover:text-white cursor-pointer disabled:opacity-10 transition-colors"
            >
              &gt;
            </button>
          </div>
        </header>

        {/* TABLA DE PARTIDOS */}
        <section>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-zinc-500 uppercase text-[8px] border-b border-zinc-900">
                  <th className="py-1 pr-2 font-bold">ID</th>
                  <th className="py-1 pr-2 font-bold">FECHA</th>
                  <th className="py-1 pr-2 font-bold">FASE</th>
                  <th className="py-1 px-2 font-bold text-center">ESTADO</th>
                  <th className="py-1 px-2 font-bold text-right pr-4">LOCAL</th>
                  <th className="py-1 px-2 font-bold text-center">SCORE</th>
                  <th className="py-1 px-2 font-bold text-left pl-4">VISITANTE</th>
                  <th className="py-1 pl-2 font-bold text-right opacity-60">UUID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {games.map(g => {
                  const isLive = g.match_status.includes("'") || g.match_status === 'ET';
                  const isUpcoming = g.home_score === null && g.away_score === null && g.match_status !== 'Final';
                  const matchDate = new Date(g.match_date);
                  const today = new Date();
                  const isToday = matchDate.getDate() === today.getDate() && 
                                  matchDate.getMonth() === today.getMonth() && 
                                  matchDate.getFullYear() === today.getFullYear();

                  // Calculamos la hora local del cliente si el partido no ha empezado
                  const localTime = matchDate.toLocaleTimeString(undefined, { 
                    hour: '2-digit', 
                    minute: '2-digit', 
                    hour12: false 
                  });

                    const hCrest = teams.find(t => t.team_id === g.home_team_id)?.team_crest_url;
                    const aCrest = teams.find(t => t.team_id === g.away_team_id)?.team_crest_url;

                    return (
                    <tr key={g.match_id} className="hover:bg-zinc-900 transition-colors group">
                      <td className="py-1 pr-2 text-zinc-500 font-bold">{g.match_id_api}</td>
                      <td className={`py-1 pr-2 whitespace-nowrap font-bold ${isToday ? 'text-emerald-400' : 'text-zinc-200'}`}>
                        {fDate(g.match_date)}
                      </td>
                      <td className="py-1 pr-2 truncate max-w-[100px] text-zinc-300">{g.stage_name || '-'}</td>
                      <td className={`py-1 px-2 font-black text-center ${isLive ? 'text-red-500 animate-pulse' : (isToday ? 'text-emerald-400' : 'text-zinc-500')}`}>
                        {isUpcoming ? localTime : g.match_status}
                      </td>
                      <td className={`py-1 px-2 text-right font-bold ${isLive ? 'text-white' : 'text-zinc-100'}`}>
                        <div className="flex items-center justify-end gap-2">
                          {g.home_team_name}
                          {hCrest && <img src={hCrest} className="w-3.5 h-3.5 object-contain" alt="" />}
                        </div>
                      </td>
                      <td className={`py-1 px-2 text-center font-black min-w-[60px] text-[10px] ${isLive ? 'text-red-500' : (isUpcoming ? 'text-zinc-700' : 'text-emerald-400')}`}>
                        {fScore(g.home_score, g.home_penalty_score)}:{fScore(g.away_score, g.away_penalty_score)}
                      </td>
                      <td className={`py-1 px-2 text-left font-bold ${isLive ? 'text-white' : 'text-zinc-100'}`}>
                        <div className="flex items-center justify-start gap-2">
                          {aCrest && <img src={aCrest} className="w-3.5 h-3.5 object-contain" alt="" />}
                          {g.away_team_name}
                        </div>
                      </td>
                    <td className="py-1 pl-2 text-right text-zinc-500 text-[7px] italic">{g.match_id.split('-')[0]}</td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* TABLA DE EQUIPOS */}
        <section className="pt-4 pb-20">
          <h2 className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest mb-2">Directorio_Equipos</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-zinc-600 uppercase text-[8px] border-b border-zinc-900">
                  <th className="py-1 pr-2 font-bold w-16">ID_SYS</th>
                  <th className="py-1 pr-2 font-bold w-6"></th>
                  <th className="py-1 pr-2 font-bold">NOMBRE</th>
                  <th className="py-1 px-2 font-bold text-center w-10">CLR</th>
                  <th className="py-1 px-2 font-bold text-center w-12">SHORT</th>
                  <th className="py-1 px-2 font-bold">ESTADIO</th>
                  <th className="py-1 px-2 font-bold">CIUDAD</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {teams.map(t => (
                  <tr key={t.team_id} className="hover:bg-zinc-900 transition-colors">
                    <td className="py-1 pr-2 text-zinc-600 font-bold">{t.team_id}</td>
                    <td className="py-1 pr-2">
                      {t.team_crest_url ? (
                        <img src={t.team_crest_url} alt="" className="w-4 h-4 object-contain brightness-110" />
                      ) : (
                        <div className="w-4 h-4 bg-zinc-800 rounded-sm" />
                      )}
                    </td>
                    <td className="py-1 pr-2 text-zinc-100 font-bold tracking-tight">{t.team_name}</td>
                    <td className="py-1 px-2 text-center">
                      <div className="w-2 h-2 mx-auto rounded-sm border border-white/10" style={{ backgroundColor: t.team_color || '#111' }} />
                    </td>
                    <td className="py-1 px-2 text-center font-black text-white">{t.team_shortname}</td>
                    <td className="py-1 px-2 text-zinc-400">{t.team_stadium || '-'}</td>
                    <td className="py-1 px-2 text-zinc-500">{t.team_city || '-'}</td>
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
