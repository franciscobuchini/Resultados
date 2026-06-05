import { useMemo } from 'react';
import FixtureTable from './FixtureTable';
import type { Match, Goal } from '../../functions/computeStandings';

interface HistoryVsFixtureProps {
  teamId: string;
  rivalId: string;
  rivalName: string;
  matches: Match[];
  goals: Goal[];
  teamLookup: Record<string, any>;
}

export default function HistoryVsFixture({
  teamId,
  rivalId,
  rivalName,
  matches,
  goals,
  teamLookup,
}: HistoryVsFixtureProps) {
  const { filteredMatches, filteredGoals, matchesByDate } = useMemo(() => {
    const filtered = matches.filter(
      m =>
        (m.home_id === teamId && m.away_id === rivalId) ||
        (m.home_id === rivalId && m.away_id === teamId)
    );

    // Ordenar por fecha descendente
    filtered.sort((a, b) => {
      const dateA = a.match_date ?? '';
      const dateB = b.match_date ?? '';
      return dateB.localeCompare(dateA);
    });

    // Inyectar el año como status label
    const adapted = filtered.map(m => {
      const year = m.match_date ? m.match_date.split('-')[0] : '✓';
      return {
        ...m,
        match_status_label: <span className="text-[10px] font-normal">{year}</span>,
      };
    });

    const matchIds = new Set(adapted.map(m => m.match_id));
    const fGoals = goals.filter(g => matchIds.has(g.match_id));

    // Agrupar por fecha
    const grouped: Record<string, Match[]> = {};
    adapted.forEach(m => {
      const key = m.match_date ?? '';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(m);
    });

    return { filteredMatches: adapted, filteredGoals: fGoals, matchesByDate: grouped };
  }, [matches, goals, teamId, rivalId]);

  if (filteredMatches.length === 0) return null;

  const teamName = teamLookup[teamId]?.team_name ?? teamId;

  const roundHeader = (
    <span>{teamName} vs {rivalName}</span>
  );

  return (
    <FixtureTable
      roundName={roundHeader}
      matchesByDate={matchesByDate}
      goals={filteredGoals}
      teamLookup={teamLookup}
      hideDateSeparators={true}
      sortDescending={true}
    />
  );
}
