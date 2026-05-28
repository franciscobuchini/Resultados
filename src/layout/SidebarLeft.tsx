import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useThemeClasses } from '../functions/themeStore';
import { LAYOUT_CONFIG } from '../functions/layoutConfig';
import { supabase } from '../functions/supabase';
import Scrollbar from './Scrollbar';
import TournamentList from '../components/ui/TournamentList';
import { Globe } from 'lucide-react';

export default function SidebarLeft() {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const navigate = useNavigate();
  const { border, textMuted } = useThemeClasses();

  const [worldCups, setWorldCups] = useState<{ tournament_id: string; tournament_name: string; tournament_crest_url: string | null }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWorldCups() {
      const { data } = await supabase
        .from('tournaments')
        .select('tournament_id, tournament_name, tournament_crest_url')
        .like('tournament_id', '%WC');

      if (data) {
        // Ordenar por ID de forma descendente (los más recientes primero)
        const sorted = [...data].sort((a, b) => b.tournament_id.localeCompare(a.tournament_id));
        setWorldCups(sorted);
      }
      setLoading(false);
    }
    fetchWorldCups();
  }, []);

  return (
    <div className={`hidden 2xl:block shrink-0 border-r ${border}`} style={{ width: LAYOUT_CONFIG.sidebarWidth }}>
      <Scrollbar className="p-6 sticky top-16 max-h-[calc(100vh-64px)]">
        <div className="flex flex-col gap-4">
          {/* Header del Sidebar */}
          <div className={`flex items-center gap-2 px-2 text-xs font-bold uppercase tracking-wider ${textMuted}`}>
            <Globe size={14} className="opacity-75" />
            <span>Copas del Mundo</span>
          </div>

          {/* Listado de Mundiales */}
          {loading ? (
            <div className={`p-6 text-center text-xs ${textMuted} animate-pulse rounded-xl border ${border}`}>
              Cargando torneos...
            </div>
          ) : (
            <TournamentList
              tournaments={worldCups}
              activeTournamentId={tournamentId}
              size="sm"
              emptyMessage="No se encontraron mundiales"
              onSelect={(id) => {
                navigate(`/tournament/${id}`);
                window.scrollTo(0, 0);
              }}
            />
          )}
        </div>
      </Scrollbar>
    </div>
  );
}
