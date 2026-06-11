import React from 'react';
import { DataRowHeader, DataRowSeparator, FixtureRow } from '../ui/DataRow';
import DataBox from '../ui/DataBox';
import type { Match, Goal } from '../../functions/computeStandings';
import { useTime, toLocal } from '../../functions/time';
import { useThemeClasses } from '../../functions/themeStore';
import { isPlayedOrPlaying, formatGoalLabel, getMatchStatusLabel } from '../../functions/matchHelpers';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface FixtureTableProps {
  /** Nombre de la fecha o encabezado personalizado (ej: logo + nombre) */
  roundName: React.ReactNode;
  /** Partidos agrupados por fecha local (YYYY-MM-DD) */
  matchesByDate: Record<string, Match[]>;
  /** Goles de los partidos */
  goals?: Goal[];
  /** Lookup de información de equipos */
  teamLookup: Record<string, any>;
  /** Callback para ir a la ronda anterior */
  onPrevRound?: () => void;
  /** Callback para ir a la ronda siguiente */
  onNextRound?: () => void;
  /** Mostrar fecha completa (ej: martes 16 de mayo) */
  fullDate?: boolean;
  /** Ocultar separadores de fecha */
  hideDateSeparators?: boolean;
  /** Ordenar fechas de forma descendente */
  sortDescending?: boolean;
  /** Mostrar año en los separadores de fecha */
  showYearInSeparator?: boolean;
}

/** Formatea un Goal de la DB usando el helper compartido */
const formatGoalName = (g: Goal): string =>
  formatGoalLabel(g.player_name, g.goal_type || 'G');

/**
 * FixtureTable - Tabla de partidos agrupada por fecha y día.
 */
export default function FixtureTable({
  roundName,
  matchesByDate,
  goals = [],
  teamLookup,
  onPrevRound,
  onNextRound,
  hideDateSeparators = false,
  sortDescending = false,
  showYearInSeparator = false
}: FixtureTableProps) {
  const { utcOffset } = useTime();
  const { bgSurfaceHover, textSuccess } = useThemeClasses();

  const sortedDates = Object.keys(matchesByDate).sort((a, b) => {
    return sortDescending ? b.localeCompare(a) : a.localeCompare(b);
  });

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

          <div className="flex-grow flex justify-center items-center min-w-0">
            {roundName}
          </div>

          <button
            onClick={onNextRound}
            disabled={!onNextRound}
            className={`p-2 ${bgSurfaceHover} rounded-full transition-colors disabled:opacity-0 disabled:cursor-default`}
            title="Siguiente"
          >
            <ChevronRight size={18} strokeWidth={3} />
          </button>
        </div>
      </DataRowHeader>

      {sortedDates.map((date, dateIdx) => {
        const dayMatches = matchesByDate[date];

        // Formatear el día
        const dateObj = new Date(date + 'T12:00:00');
        const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long' };

        const formattedDay = showYearInSeparator
          ? dateObj.getFullYear().toString()
          : dateObj.toLocaleDateString('es-ES', options).replace(/,/g, '');

        return (
          <React.Fragment key={date}>
            {!hideDateSeparators && <DataRowSeparator label={formattedDay} />}

            {dayMatches.map((match, matchIdx) => {
              const local = toLocal(match.match_date, match.match_time_utc, utcOffset);
              const isMatchPlayedOrPlaying = isPlayedOrPlaying(match.match_status);
              const isLastInDate = matchIdx === dayMatches.length - 1;
              const isLastInTable = dateIdx === sortedDates.length - 1 && isLastInDate;

              // Filtrar goles de este partido
              const matchGoals = goals.filter(g => g.match_id === match.match_id);
              const homeGoals = matchGoals.filter(g => g.team_id === match.home_id);
              const awayGoals = matchGoals.filter(g => g.team_id === match.away_id);

              // Formatear goleadores para el efecto hover
              const homeScorers = homeGoals.length > 0 ? (
                <div className="flex flex-wrap items-center justify-end gap-x-2 leading-tight">
                  {homeGoals.map((g, idx) => (
                    <span key={g.goal_id} className="whitespace-nowrap">
                      {g.goal_minute && <span className={textSuccess}>{g.goal_minute}'</span>} {formatGoalName(g)}{idx < homeGoals.length - 1 ? ',' : ''}
                    </span>
                  ))}
                </div>
              ) : null;

              const awayScorers = awayGoals.length > 0 ? (
                <div className="flex flex-wrap items-center justify-start gap-x-2 leading-tight">
                  {awayGoals.map((g, idx) => (
                    <span key={g.goal_id} className="whitespace-nowrap">
                      {g.goal_minute && <span className={textSuccess}>{g.goal_minute}'</span>} {formatGoalName(g)}{idx < awayGoals.length - 1 ? ',' : ''}
                    </span>
                  ))}
                </div>
              ) : null;

              return (
                <React.Fragment key={match.match_id}>
                  <FixtureRow
                    matchId={match.match_id}
                    matchDate={match.match_date}
                    homeId={match.home_id!}
                    homeLogo={teamLookup[match.home_id!]?.team_crest_url}
                    homeName={match.home_name ?? teamLookup[match.home_id!]?.team_name}
                    homeIdDM={teamLookup[match.home_id!]?.team_id_api_drsm}
                    homeScore={isMatchPlayedOrPlaying ? match.home_score : null}
                    homeScorers={homeScorers}
                    awayId={match.away_id!}
                    awayLogo={teamLookup[match.away_id!]?.team_crest_url}
                    awayName={match.away_name ?? teamLookup[match.away_id!]?.team_name}
                    awayIdDM={teamLookup[match.away_id!]?.team_id_api_drsm}
                    awayScore={isMatchPlayedOrPlaying ? match.away_score : null}
                    awayScorers={awayScorers}
                    homePenalty={match.home_penalty}
                    awayPenalty={match.away_penalty}
                    matchTime={local.time}
                    statusLabel={match.match_status_label ?? getMatchStatusLabel(match.match_status, match.match_date)}
                    matchStatus={match.match_status}
                    matchNotes={match.match_notes}
                    goals={goals}
                    noBorder={isLastInTable}
                  />
                </React.Fragment>
              );
            })}
          </React.Fragment>
        );
      })}
    </DataBox>
  );
}
