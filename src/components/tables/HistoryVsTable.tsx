import { StandingsHeaderRow, StandingsRow, StatGroup, Stat } from '../ui/DataRow';
import DataBox from '../ui/DataBox';
import { useState } from 'react';
import { useThemeClasses } from '../../functions/themeStore';
import { ChevronUp, ChevronDown } from 'lucide-react';
import HistoryVsFixture from './HistoryVsFixture';
import type { Match, Goal } from '../../functions/computeStandings';

export interface HistoryStats {
  rivalId: string;
  rivalName: string;
  rivalLogo: string | null;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  diff: number; // Won - Lost
}

interface HistoryVsTableProps {
  title?: string;
  stats: HistoryStats[];
  teamId?: string;
  matches?: Match[];
  goals?: Goal[];
  teamLookup?: Record<string, any>;
}

type SortField = 'diff' | 'played' | 'won' | 'drawn' | 'lost';

/**
 * HistoryVsTable - Tabla de historiales contra otros equipos.
 */
export default function HistoryVsTable({
  title = "Historial por Rival",
  stats,
  teamId,
  matches = [],
  goals = [],
  teamLookup = {},
}: HistoryVsTableProps) {
  const [sortField, setSortField] = useState<SortField>('diff');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [selectedRivalId, setSelectedRivalId] = useState<string | null>(null);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  // Ordenar por el campo seleccionado
  const sortedStats = [...stats].sort((a, b) => {
    const valA = a[sortField];
    const valB = b[sortField];

    if (sortDir === 'desc') {
      return valB - valA;
    } else {
      return valA - valB;
    }
  });

  const renderHeaderStat = (label: string, field: SortField) => {
    const isActive = sortField === field;
    return (
      <Stat
        value={
          <div className="flex items-center gap-0.5">
            <span>{label}</span>
            {isActive && (
              sortDir === 'desc' ? <ChevronDown size={10} /> : <ChevronUp size={10} />
            )}
          </div>
        }
        onClick={() => toggleSort(field)}
        className={isActive ? 'text-current font-bold' : ''}
      />
    );
  };

  const headerStats = (
    <StatGroup>
      {renderHeaderStat('DIF', 'diff')}
      {renderHeaderStat('PJ', 'played')}
      {renderHeaderStat('PG', 'won')}
      {renderHeaderStat('PE', 'drawn')}
      {renderHeaderStat('PP', 'lost')}
    </StatGroup>
  );

  const { textSuccess, textError } = useThemeClasses();

  const selectedRival = selectedRivalId
    ? sortedStats.find(s => s.rivalId === selectedRivalId)
    : null;

  return (
    <div className="flex flex-col gap-4">
      {/* Fixture de enfrentamientos directos */}
      {selectedRivalId && teamId && selectedRival ? (
        <HistoryVsFixture
          teamId={teamId}
          rivalId={selectedRivalId}
          rivalName={selectedRival.rivalName}
          matches={matches}
          goals={goals}
          teamLookup={teamLookup}
        />
      ) : (
        <p className="text-sm italic px-2 opacity-70">
          Seleccioná un país para ver todos los partidos
        </p>
      )}

      <DataBox>
        <StandingsHeaderRow
          title={title}
          stats={headerStats}
        />

        {sortedStats.map((item, idx) => {
          const diffText = item.diff > 0 ? `+${item.diff}` : item.diff;
          const isSelected = selectedRivalId === item.rivalId;

          return (
            <div
              key={item.rivalId}
              onClick={() => setSelectedRivalId(isSelected ? null : item.rivalId)}
              className="block cursor-pointer transition-opacity hover:opacity-80"
            >
              <StandingsRow
                position={idx + 1}
                logo={item.rivalLogo}
                name={item.rivalName}
                noBorder={idx === sortedStats.length - 1}
                stats={
                  <StatGroup>
                    <Stat
                      value={diffText}
                      prominent
                      className={item.diff > 0 ? textSuccess : item.diff < 0 ? textError : ''}
                    />
                    <Stat value={item.played} />
                    <Stat value={item.won} />
                    <Stat value={item.drawn} />
                    <Stat value={item.lost} />
                  </StatGroup>
                }
              />
            </div>
          );
        })}

        {sortedStats.length === 0 && (
          <div className="p-8 text-center text-sm opacity-50 italic">
            No hay datos de historial disponibles
          </div>
        )}
      </DataBox>
    </div>
  );
}
