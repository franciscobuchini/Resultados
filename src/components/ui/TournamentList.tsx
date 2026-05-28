import { useThemeClasses } from '../../functions/themeStore';
import { Check, ChevronRight } from 'lucide-react';
import ImageCrest from './ImageCrest';
import DataBox from './DataBox';
import EmptyState from './EmptyState';

export interface TournamentListItem {
  tournament_id: string;
  tournament_name: string;
  tournament_crest_url: string | null;
}

interface TournamentListProps {
  tournaments: TournamentListItem[];
  activeTournamentId?: string;
  onSelect: (tournamentId: string) => void;
  size?: 'sm' | 'md';
  emptyMessage?: string;
}

export default function TournamentList({
  tournaments,
  activeTournamentId,
  onSelect,
  size = 'md',
  emptyMessage
}: TournamentListProps) {
  const { 
    bgSurfaceHover, 
    bgProminent, 
    textMain, 
    textMuted, 
    textAccent,
    border
  } = useThemeClasses();

  const isSmall = size === 'sm';
  const rowPadding = isSmall ? 'p-3' : 'p-4';
  const fontSize = isSmall ? 'text-xs' : 'text-sm';
  const crestSize = isSmall ? 'sm' : 'md';
  const iconSize = isSmall ? 14 : 18;

  return (
    <DataBox>
      {tournaments.map((t, idx) => {
        const isActive = t.tournament_id === activeTournamentId;
        return (
          <button
            key={t.tournament_id}
            onClick={() => {
              if (isActive) return;
              onSelect(t.tournament_id);
            }}
            className={`w-full flex items-center justify-between text-left transition-colors ${rowPadding} ${fontSize} ${
              idx !== tournaments.length - 1 ? `border-b ${border}` : ''
            } ${isActive ? `${bgProminent} pointer-events-none` : bgSurfaceHover}`}
          >
            <div className="flex items-center gap-4 min-w-0">
              <ImageCrest src={t.tournament_crest_url} size={crestSize} className="shrink-0" />
              <span className={`font-semibold truncate ${isActive ? textAccent : textMain}`}>
                {t.tournament_name}
              </span>
            </div>
            <div className={`shrink-0 ${isActive ? textAccent : textMuted}`}>
              {isActive ? (
                <Check size={iconSize} strokeWidth={3} />
              ) : (
                <ChevronRight size={iconSize} />
              )}
            </div>
          </button>
        );
      })}

      {tournaments.length === 0 && (
        <div className="p-8 text-center">
          <EmptyState message={emptyMessage ?? "No se encontraron torneos"} />
        </div>
      )}
    </DataBox>
  );
}
