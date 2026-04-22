import { useEffect, useState } from 'react'
import { supabase } from '../functions/supabaseClient'

export default function AllTeamsTable() {
  const [data, setData] = useState<any[]>([])
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

  const columns = data.length > 0 ? Object.keys(data[0]) : []

  return (
    <div className="p-4 overflow-x-auto pb-12 text-center">
      <h2 className="text-zinc-500 text-xs font-mono uppercase mb-4 text-left px-2">Equipos (Mapeo)</h2>
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
                const value = row[col]
                
                // Lógica especial para COLOR
                if (col === 'team_color' && value) {
                  return (
                    <td key={col} className="border border-zinc-800 p-1">
                      <div 
                        className="w-full h-6 rounded-sm shadow-inner" 
                        style={{ backgroundColor: value }}
                        title={value}
                      />
                    </td>
                  )
                }

                // Lógica especial para ESCUDO (URL)
                if (col === 'team_crest_url' && value) {
                  return (
                    <td key={col} className="border border-zinc-800 p-1">
                      <div className="flex justify-center">
                        <img 
                          src={value} 
                          alt="crest" 
                          className="h-6 w-auto object-contain"
                          onError={(e) => (e.currentTarget.style.display = 'none')} 
                        />
                      </div>
                    </td>
                  )
                }

                return (
                  <td key={col} className="border border-zinc-800 p-2 whitespace-nowrap text-zinc-300">
                    {value === null ? <span className="text-zinc-700">null</span> : String(value)}
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
