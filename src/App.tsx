import { useState, useEffect } from 'react'
import SyncStatus from './components/SyncStatus'
import AllMatchesTable from './components/AllMatchesTable'
import AllTeamsTable from './components/AllTeamsTable'
import UtcSelector from './components/UtcSelector'
import JsonImporter from './components/JsonImporter'
import ReadmeViewer from './components/ReadmeViewer'

export default function App() {
  const [utcOffset, setUtcOffset] = useState<number>(() => {
    const saved = localStorage.getItem('utcOffset')
    return saved ? parseInt(saved, 10) : -3 // Por defecto Argentina
  })

  useEffect(() => {
    localStorage.setItem('utcOffset', utcOffset.toString())
  }, [utcOffset])

  return (
    <div className="bg-neutral-900 min-h-screen pb-20">
      {/* Header flotante con los controles */}
      <div className="fixed bottom-6 right-6 flex items-center gap-3 z-50">
        <UtcSelector currentOffset={utcOffset} onOffsetChange={setUtcOffset} />
        <SyncStatus />
      </div>

      <div className="pt-2">
        {/* Importador de JSON */}
        <JsonImporter />

        {/* Tabla de Partidos */}
        <AllMatchesTable utcOffset={utcOffset} />
        
        {/* Tabla de Equipos */}
        <AllTeamsTable />
        
        {/* Visualizador de README */}
        <ReadmeViewer />
      </div>
    </div>
  )
}
