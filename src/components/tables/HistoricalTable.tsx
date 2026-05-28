import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { StandingsHeaderRow, StandingsRow, StatGroup, Stat } from '../ui/DataRow';
import DataBox from '../ui/DataBox';
import { ChevronUp, ChevronDown, Star } from 'lucide-react';
import { useThemeClasses } from '../../functions/themeStore';
import type { TeamStanding } from '../../functions/computeStandings';

export interface HistoricalTeamStanding extends TeamStanding {
  tj: number;
  titles: number;
  rend: number;
}

interface TeamInfo {
  team_id: string;
  team_name: string | null;
  team_crest_url: string | null;
}

interface HistoricalTableProps {
  /** Título de la tabla (opcional) */
  title?: string;
  /** Array de posiciones calculado */
  standings: HistoricalTeamStanding[];
  /** Diccionario de información de equipos (escudos, nombres reales) */
  teamLookup: Record<string, TeamInfo>;
}

type SortField = 'tj' | 'points' | 'played' | 'won' | 'drawn' | 'lost' | 'goal_difference' | 'titles' | 'rend';

/**
 * HistoricalTable - Tabla de posiciones histórica.
 */
export default function HistoricalTable({ title, standings, teamLookup }: HistoricalTableProps) {
  const { textAlert } = useThemeClasses();
  const [sortField, setSortField] = useState<SortField>('points');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  // Ordenar por el campo seleccionado, conservando el orden original (índice) si son iguales
  const sortedStandings = standings
    .map((team, index) => ({ team, index }))
    .sort((a, b) => {
      const valA = a.team[sortField];
      const valB = b.team[sortField];

      if (valA !== valB) {
        return sortDir === 'desc' ? valB - valA : valA - valB;
      }
      return a.index - b.index;
    })
    .map(item => item.team);

  const renderHeaderStat = (label: ReactNode, field: SortField, titleStr?: string, extraClass = '') => {
    const isActive = sortField === field;
    const hasCustomColor = extraClass.includes('text-');
    const activeClass = isActive 
      ? (hasCustomColor ? 'font-bold' : 'text-current font-bold') 
      : '';

    return (
      <Stat
        value={
          <div className="flex items-center gap-0.5 justify-center">
            {label}
            {isActive && (
              sortDir === 'desc' ? <ChevronDown size={10} className="shrink-0" /> : <ChevronUp size={10} className="shrink-0" />
            )}
          </div>
        }
        title={titleStr}
        onClick={() => toggleSort(field)}
        className={`${extraClass} ${activeClass}`}
      />
    );
  };

  const statColumns = (
    <StatGroup>
      {renderHeaderStat('TJ', 'tj', 'Torneos Jugados', 'hidden sm:flex')}
      {renderHeaderStat('PTS', 'points', 'Puntos')}
      {renderHeaderStat('PJ', 'played', 'Partidos Jugados')}
      {renderHeaderStat('PG', 'won', 'Partidos Ganados', 'hidden xl:flex')}
      {renderHeaderStat('PE', 'drawn', 'Partidos Empatados', 'hidden xl:flex')}
      {renderHeaderStat('PP', 'lost', 'Partidos Perdidos', 'hidden xl:flex')}
      {renderHeaderStat('+/-', 'goal_difference', 'Diferencia de Goles')}
      {renderHeaderStat(<Star size={12} className="fill-current" />, 'titles', 'Títulos', textAlert)}
      {renderHeaderStat('%', 'rend', 'Rendimiento', 'hidden sm:flex')}
    </StatGroup>
  );

  return (
    <DataBox>
      <StandingsHeaderRow
        title={title ? `Grupo ${title}` : "Historial Completo"}
        stats={statColumns}
      />

      {sortedStandings.map((team, idx) => {
        const info = teamLookup[team.team_id.trim()];

        return (
          <Link key={team.team_id} to={`/team/${team.team_id}`} className="block transition-opacity hover:opacity-80">
            <StandingsRow
              position={idx + 1}
              logo={info?.team_crest_url}
              name={info?.team_name ?? team.team_name}
              noBorder={idx === standings.length - 1}
              stats={
                <StatGroup>
                  <Stat value={team.tj} className="hidden sm:flex" />
                  <Stat value={team.points} prominent />
                  <Stat value={team.played} />
                  <Stat value={team.won} className="hidden xl:flex" />
                  <Stat value={team.drawn} className="hidden xl:flex" />
                  <Stat value={team.lost} className="hidden xl:flex" />
                  <Stat
                    value={team.goal_difference > 0 ? `+${team.goal_difference}` : team.goal_difference}
                  />
                  <Stat value={team.titles > 0 ? team.titles : '-'} className={`${textAlert} font-black`} />
                  <Stat value={`${team.rend.toFixed(1)}%`} className="hidden sm:flex text-xs" />
                </StatGroup>
              }
            />
          </Link>
        );
      })}
    </DataBox>
  );
}
