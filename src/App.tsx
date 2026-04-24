import { TimeProvider } from './contexts/TimeContext'
import { AuthProvider } from './contexts/AuthContext'
import SyncStatus from './components/SyncStatus'
import AllMatchesTable from './components/AllMatchesTable'
import AllTeamsTable from './components/AllTeamsTable'
import UtcSelector from './components/UtcSelector'
import JsonImporter from './components/JsonImporter'
import ReadmeViewer from './components/ReadmeViewer'
import UserMenu from './components/auth/UserMenu'

export default function App() {
  return (
    <AuthProvider>
      <TimeProvider>
        <div className="bg-neutral-900 min-h-screen pb-20 relative">
          {/* Header flotante con los controles */}
          <div className="fixed bottom-6 right-6 flex items-center gap-3 z-50">
            <UserMenu />
            <UtcSelector />
            <SyncStatus />
          </div>

          <div className="pt-2">
            {/* Importador de JSON */}
            <JsonImporter />

            {/* Tabla de Partidos */}
            <AllMatchesTable />
            
            {/* Tabla de Equipos */}
            <AllTeamsTable />
            
            {/* Visualizador de README */}
            <ReadmeViewer />
          </div>
        </div>
      </TimeProvider>
    </AuthProvider>
  )
}
