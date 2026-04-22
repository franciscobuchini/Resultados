import { useState, useEffect } from 'react'
import SyncStatus from './components/SyncStatus'
import AllMatchTable from './components/AllMatchTable'
import UtcSelector from './components/UtcSelector'

export default function App() {
  const [utcOffset, setUtcOffset] = useState<number>(() => {
    const saved = localStorage.getItem('utcOffset')
    return saved ? parseInt(saved, 10) : -3 // Por defecto Argentina
  })

  useEffect(() => {
    localStorage.setItem('utcOffset', utcOffset.toString())
  }, [utcOffset])

  return (
    <div className="bg-neutral-900 min-h-screen">
      {/* Header flotante con los controles */}
      <div className="fixed bottom-6 right-6 flex items-center gap-3 z-50">
        <UtcSelector currentOffset={utcOffset} onOffsetChange={setUtcOffset} />
        <SyncStatus />
      </div>

      <div className="pt-2">
        <AllMatchTable utcOffset={utcOffset} />
      </div>
    </div>
  )
}
