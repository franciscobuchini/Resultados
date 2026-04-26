import SyncStatus from './components/SyncStatus'
import UtcSelector from './components/UtcSelector'
import FileImporter from './components/FileImporter'

export default function App() {
  return (
    <div className="bg-neutral-900 min-h-screen pb-20 relative">
      <div className="fixed bottom-6 right-6 flex items-center gap-3 z-50">
        <UtcSelector />
        <SyncStatus />
      </div>

      <div className="pt-2">
        <FileImporter />
      </div>
    </div>
  )
}
