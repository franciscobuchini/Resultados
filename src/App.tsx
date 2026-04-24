import { useState } from 'react'
import SyncStatus from './components/SyncStatus'
import AllMatchesTable from './components/AllMatchesTable'
import UtcSelector from './components/UtcSelector'
import JsonImporter from './components/JsonImporter'
import StandingsTable from './components/StandingsTable'
import TournamentSelector from './components/TournamentSelector'
import FixtureTable from './components/FixtureTable'

export default function App() {
  const [selectedTournament, setSelectedTournament] = useState<string>('')
  return (
    <div className="bg-neutral-900 min-h-screen pb-20 relative">
      <div className="fixed bottom-6 right-6 flex items-center gap-3 z-50">
        <UtcSelector />
        <SyncStatus />
      </div>

      <div className="pt-2">
        <JsonImporter />
        <AllMatchesTable />
        <TournamentSelector selectedTournament={selectedTournament} onSelect={setSelectedTournament} />
        <StandingsTable selectedTournament={selectedTournament} />
        <FixtureTable selectedTournament={selectedTournament} />
      </div>
    </div>
  )
}
