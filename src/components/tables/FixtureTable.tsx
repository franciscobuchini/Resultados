import React from 'react';
import { DataRowHeader, DataRowSeparator, FixtureRow, DetailsRow } from '../ui/DataRow';
import DataBox from '../ui/DataBox';
import type { Match, Goal } from '../../../shared/tournament/matchTypes';
import { useTime, toLocal } from '../../functions/time';
import { useThemeClasses } from '../../functions/themeStore';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface FixtureTableProps {
  /** Nombre de la fecha (ej: "Fecha 1", "Octavos de Final") */
  roundName: string;
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
}

/** Helper para determinar si un partido ya empezó o terminó */
const isPlayedOrPlaying = (status: string | null): boolean => {
  if (!status) return false;
  const s = status.toLowerCase().trim();
  // 'ns' = Not Started, 'tbd' = To Be Determined, 'canc' = Cancelled, 'post' = Postponed
  const notStarted = ['ns', 'tbd', 'scheduled', 'postponed', 'cancelled'].includes(s);
  return !notStarted && s !== '';
};

/** Formatea el nombre del goleador con sus etiquetas (P) o (EC) */
const formatGoalName = (g: Goal): string => {
  let s = g.player_name;
  const type = (g.goal_type || '').toUpperCase();

  // Evitar duplicados si ya está en el nombre
  if (type === 'P' && !s.toUpperCase().includes('(P)')) s += ' (P)';
  else if ((type === 'C' || type === 'EC') && !s.toUpperCase().includes('(EC)')) s += ' (EC)';

  return s;
};

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
  fullDate = false,
  hideDateSeparators = false,
  sortDescending = false
}: FixtureTableProps) {
  const { utcOffset } = useTime();
  const { bgSurfaceHover, textMain, textSuccess } = useThemeClasses();

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

      {sortedDates.map((date, dateIdx) => {
        const dayMatches = matchesByDate[date];

        // Formatear el día
        const dateObj = new Date(date + 'T12:00:00');
        const options: Intl.DateTimeFormatOptions = fullDate
          ? { weekday: 'long', day: 'numeric', month: 'long' }
          : { weekday: 'long', day: 'numeric' };

        const formattedDay = dateObj.toLocaleDateString('es-ES', options);

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

              return (
                <React.Fragment key={match.match_id}>
                  <FixtureRow
                    homeId={match.home_id!}
                    homeLogo={teamLookup[match.home_id!]?.team_crest_url}
                    homeName={teamLookup[match.home_id!]?.team_name ?? match.home_name}
                    homeScore={match.home_score}
                    awayId={match.away_id!}
                    awayLogo={teamLookup[match.away_id!]?.team_crest_url}
                    awayName={teamLookup[match.away_id!]?.team_name ?? match.away_name}
                    awayScore={match.away_score}
                    homePenalty={match.home_penalty}
                    awayPenalty={match.away_penalty}
                    matchTime={local.time}
                    // Si mostramos detalles, la FixtureRow NO lleva el borde inferior (lo lleva la DetailsRow)
                    noBorder={isMatchPlayedOrPlaying ? true : isLastInTable}
                  />
                  {isMatchPlayedOrPlaying && (
                    <DetailsRow noBorder={isLastInTable}>
                      <div className={`flex w-full ${textMain}`}>
                        {/* Goleadores Local */}
                        <div className="flex-1 text-right pr-12">
                          <div className="flex flex-wrap items-center justify-end gap-x-2">
                            {homeGoals.length > 0 ? (
                              homeGoals.map((g, idx) => (
                                <span key={g.goal_id}>
                                  {g.goal_minute && <span className={textSuccess}>{g.goal_minute}' </span>}
                                  <span>{formatGoalName(g)}{idx < homeGoals.length - 1 ? ',' : ''}</span>
                                </span>
                              ))
                            ) : (
                              <span className="opacity-0">—</span>
                            )}
                          </div>
                        </div>
                        {/* Goleadores Visita */}
                        <div className="flex-1 text-left pl-12">
                          <div className="flex flex-wrap items-center justify-start gap-x-2">
                            {awayGoals.length > 0 ? (
                              awayGoals.map((g, idx) => (
                                <span key={g.goal_id}>
                                  {g.goal_minute && <span className={textSuccess}>{g.goal_minute}' </span>}
                                  <span>{formatGoalName(g)}{idx < awayGoals.length - 1 ? ',' : ''}</span>
                                </span>
                              ))
                            ) : (
                              <span className="opacity-0">—</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </DetailsRow>
                  )}
                </React.Fragment>
              );
            })}
          </React.Fragment>
        );
      })}
    </DataBox>
  );
}
