import type { TabConfig } from '../tabTypes'
import { useThemeClasses } from '../../functions/themeStore'
import { Check, ChevronRight } from 'lucide-react'
import ImageCrest from '../../components/ui/ImageCrest'
import EmptyState from '../../components/ui/EmptyState'

export const tabConfig: TabConfig = {
  id: 'editions',
  label: 'Ediciones',
  order: 3,
}

// ------------------------------------------------------------
// PROPS
// ------------------------------------------------------------

interface EdicionesTabProps {
  tournamentId: string
  historyTournaments: { tournament_id: string; tournament_name: string; tournament_crest_url: string | null }[]
  navigate: (path: string) => void
  setActiveTab: (tab: string) => void
}

// ------------------------------------------------------------
// COMPONENTE
// ------------------------------------------------------------

export default function EdicionesTab({
  tournamentId, historyTournaments, navigate, setActiveTab
}: EdicionesTabProps) {
  const { bgSurface, border, textMain, textMuted, bgSurfaceHover, bgProminent, textAccent } = useThemeClasses()

  return (
    <div className={`rounded-xl border ${border} ${bgSurface} overflow-hidden`}>
      {historyTournaments.map((t, idx) => {
        const isActive = t.tournament_id === tournamentId;
        return (
          <button
            key={t.tournament_id}
            onClick={() => {
              if (isActive) return;
              navigate(`/tournament/${t.tournament_id}`)
              setActiveTab('tournament')
              window.scrollTo(0, 0)
            }}
            className={`w-full flex items-center justify-between p-4 text-left transition-colors ${
              idx !== historyTournaments.length - 1 ? `border-b ${border}` : ''
            } ${isActive ? `${bgProminent} pointer-events-none` : bgSurfaceHover}`}
          >
            <div className="flex items-center gap-4">
              <ImageCrest src={t.tournament_crest_url} size="md" />
              <div className="flex flex-col">
                <span className={`font-semibold ${isActive ? textAccent : textMain}`}>
                  {t.tournament_name}
                </span>
              </div>
            </div>
            <div className={isActive ? textAccent : textMuted}>
              {isActive ? (
                <Check size={18} strokeWidth={3} />
              ) : (
                <ChevronRight size={18} />
              )}
            </div>
          </button>
        );
      })}
      
      {historyTournaments.length === 0 && (
        <div className="p-8 text-center">
          <EmptyState message="No se encontraron otras ediciones de este torneo" />
        </div>
      )}
    </div>
  )
}
