import { useEffect, useState } from 'react'
import { supabase } from '../functions/supabase'

interface Team {
  team_id: string;
  team_id_api: number;
  team_color?: string | null;
  team_crest_url?: string | null;
  team_country_id?: string | null;
  [key: string]: string | number | null | undefined;
}

export default function AllTeamsTable() {
  const [data, setData] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const { data: teams } = await supabase
        .from('teams')
        .select('*')
        .order('team_id', { ascending: true })
      
      if (teams) setData(teams)
      setLoading(false)
    }
    fetchData()
  }, [])

  if (loading) return <div className="p-4 text-zinc-100">Cargando equipos...</div>

  return (
    <div className="p-4 overflow-x-auto pb-12 text-center max-w-2xl mx-auto">
      <h2 className="text-zinc-500 text-xs font-mono uppercase mb-4 text-left px-2">Equipos</h2>
      <table className="w-full border-collapse text-[10px] font-mono bg-black text-zinc-400 min-w-max">
        <thead>
          <tr className="bg-neutral-950 sticky top-0">
            <th className="border border-zinc-800 p-2 text-center text-sm text-zinc-100 uppercase">Team ID</th>
            <th className="border border-zinc-800 p-2 text-center text-sm text-zinc-100 uppercase">Nombre</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="hover:bg-zinc-900 transition-colors">
              <td className="border border-zinc-800 p-2 whitespace-nowrap text-zinc-500">{row.team_id}</td>
              <td className="border border-zinc-800 p-2 whitespace-nowrap text-zinc-300 font-bold">{row.team_name}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
