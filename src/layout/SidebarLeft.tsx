import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useThemeClasses } from '../functions/themeStore';
import { LAYOUT_CONFIG } from '../functions/layoutConfig';
import { supabase } from '../functions/supabase';
import { create } from 'zustand';

interface SidebarState {
  isOpen: boolean;
  toggle: () => void;
  close: () => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  isOpen: false,
  toggle: () => set((s) => ({ isOpen: !s.isOpen })),
  close: () => set({ isOpen: false }),
}));
import TournamentList from '../components/ui/TournamentList';
import { Button } from '../components/ui/Button';
import { BarChart3 } from 'lucide-react';

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const navigate = useNavigate();
  const { textMuted } = useThemeClasses();

  const [worldCups, setWorldCups] = useState<{ tournament_id: string; tournament_name: string; tournament_crest_url: string | null }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWorldCups() {
      try {
        const { data, error } = await supabase
          .from('tournaments')
          .select('tournament_id, tournament_name, tournament_crest_url')
          .like('tournament_id', '%WC');

        if (error) {

        }
        if (data) {
          const sorted = [...data].sort((a, b) => b.tournament_id.localeCompare(a.tournament_id));
          setWorldCups(sorted);
        }
      } catch (err) {

      } finally {
        setLoading(false);
      }
    }
    fetchWorldCups();
  }, []);

  return (
    <div className="flex flex-col gap-4 my-4">
      <Button
        icon={BarChart3}
        label="Estadísticas Mundiales"
        className='mx-4'
        onClick={() => {
          navigate('/tournament/INT.2026.WC/stats');
          window.scrollTo(0, 0);
          onNavigate?.();
        }}
      />
    

      {loading ? (
        <div className={`text-center text-xs ${textMuted} animate-pulse`}>
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
            onNavigate?.();
          }}
        />
      )}
    </div>
  );
}

export default function SidebarLeft() {
  const { border, bgApp } = useThemeClasses();
  const { isOpen, close } = useSidebarStore();

  // Cerrar drawer al cambiar a desktop
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1536px)');
    const handler = () => { if (mq.matches) close(); };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [close]);

  // Bloquear scroll del body cuando el drawer está abierto
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <>
      {/* Desktop sidebar */}
      <div className={`hidden 2xl:block shrink-0 border-r ${border}`} style={{ width: LAYOUT_CONFIG.sidebarWidth }}>
        <div className="pt-6">
          <SidebarContent />
        </div>
      </div>

      {/* Mobile full-screen overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40 2xl:hidden">
          {/* Full-screen panel */}
          <div className={`absolute inset-0 top-16 ${bgApp} flex flex-col`}>
            {/* Content */}
            <div className="p-6 overflow-y-auto no-scrollbar flex-1 pb-20">
              <SidebarContent onNavigate={close} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
