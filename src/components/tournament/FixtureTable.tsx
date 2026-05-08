import { DataRowHeader, DataRowSeparator, FixtureRow } from '../ui/DataRow';
import DataBox from '../ui/DataBox';
import type { Match } from '../../../shared/tournament/matchTypes';
import { useTime, toLocal } from '../../functions/time';
import { useThemeClasses } from '../../functions/themeStore';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface FixtureTableProps {
  /** Nombre de la fecha (ej: "Fecha 1", "Octavos de Final") */
  roundName: string;
  /** Partidos agrupados por fecha local (YYYY-MM-DD) */
  matchesByDate: Record<string, Match[]>;
  /** Lookup de información de equipos */
  teamLookup: Record<string, any>;
  /** Callback para ir a la ronda anterior */
  onPrevRound?: () => void;
  /** Callback para ir a la ronda siguiente */
  onNextRound?: () => void;
}

/**
 * FixtureTable - Tabla de partidos agrupada por fecha y día.
 */
export default function FixtureTable({ 
  roundName, 
  matchesByDate, 
  teamLookup, 
  onPrevRound, 
  onNextRound 
}: FixtureTableProps) {
  const { utcOffset } = useTime();
  const { bgSurfaceHover } = useThemeClasses();
  const sortedDates = Object.keys(matchesByDate).sort();

  return (
    <DataBox>
      {/* Cabecera con navegación */}
      <DataRowHeader>
        <div className="flex items-center justify-between w-full">
          <button 
            onClick={onPrevRound}
            disabled={!onPrevRound}
            className={`p-2 ${bgSurfaceHover} rounded-full transition-colors disabled:opacity-0 disabled:cursor-default`}
            title="Anterior"
          >
            <ChevronLeft size={18} strokeWidth={3} />
          </button>
          
          <span className="flex-grow text-center">{roundName}</span>

          <button 
            onClick={onNextRound}
            disabled={!onNextRound}
            className={`p-1 ${bgSurfaceHover} rounded-full transition-colors disabled:opacity-0 disabled:cursor-default`}
            title="Siguiente"
          >
            <ChevronRight size={18} strokeWidth={3} />
          </button>
        </div>
      </DataRowHeader>

      {sortedDates.map(date => {
        const dayMatches = matchesByDate[date];

        // Formatear el día (ej: "jueves 29")
        const dateObj = new Date(date + 'T12:00:00');
        const dayName = dateObj.toLocaleDateString('es-ES', { weekday: 'long' });
        const dayNum = dateObj.getDate();
        const formattedDay = `${dayName} ${dayNum}`;

        return (
          <div key={date}>
            <DataRowSeparator label={formattedDay} />

            {dayMatches.map(match => {
              // Convertir hora UTC → hora local (una sola llamada, cero preocupaciones)
              const local = toLocal(match.match_date, match.match_time_utc, utcOffset);
              
              const statusDisplay = 
                (match.match_status?.toLowerCase() === 'prog.' || match.match_status === 'NS')
                  ? local.time
                  : match.match_status;

              return (
                <FixtureRow
                  key={match.match_id}
                  homeLogo={teamLookup[match.home_id!]?.team_crest_url}
                  homeName={teamLookup[match.home_id!]?.team_name ?? match.home_name}
                  homeScore={match.home_score}
                  awayLogo={teamLookup[match.away_id!]?.team_crest_url}
                  awayName={teamLookup[match.away_id!]?.team_name ?? match.away_name}
                  awayScore={match.away_score}
                  status={statusDisplay}
                />
              );
            })}
          </div>
        );
      })}
    </DataBox>
  );
}
