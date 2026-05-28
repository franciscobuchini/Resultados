import type { TabConfig } from '../tabTypes'
import TournamentList from '../../components/ui/TournamentList'

export const tabConfig: TabConfig = {
  id: 'editions',
  label: 'Ediciones',
  order: 3,
  disabled: true,
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
  return (
    <TournamentList
      tournaments={historyTournaments}
      activeTournamentId={tournamentId}
      size="md"
      emptyMessage="No se encontraron otras ediciones de este torneo"
      onSelect={(id) => {
        navigate(`/tournament/${id}`);
        setActiveTab('tournament');
        window.scrollTo(0, 0);
      }}
    />
  );
}
