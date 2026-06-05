import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../../functions/supabase';
import FixtureTable from '../tables/FixtureTable';
import type { Match, Goal } from '../../functions/computeStandings';
import { getTeamAliases, resolveTeamId } from '../../functions/matchHelpers';

// ------------------------------------------------------------
// TIPOS LOCALES
// ------------------------------------------------------------

interface TeamInfo {
  team_id: string;
  team_name: string;
  team_crest_url: string | null;
}

// ------------------------------------------------------------
// COMPONENTE
// ------------------------------------------------------------

export default function Efemerides({ date }: { date: string }) {
  const [loading, setLoading] = useState(true);
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [teamLookup, setTeamLookup] = useState<Record<string, TeamInfo>>({});
  const [tournamentLookup, setTournamentLookup] = useState<Record<string, string>>({});

  // ── Fetch inicial (una sola vez) ──────────────────────────
  useEffect(() => {
    async function initData() {
      try {
        const { data: matchesData } = await supabase
          .from('matches')
          .select('*')
          .like('tournament_id', 'INT%WC');

        if (!matchesData) { setLoading(false); return; }
        const matchesList = matchesData as Match[];
        setAllMatches(matchesList);

        // Torneos
        const tIds = [...new Set(matchesList.map(m => m.tournament_id).filter(Boolean))] as string[];
        if (tIds.length > 0) {
          const { data: tournaments } = await supabase
            .from('tournaments')
            .select('tournament_id, tournament_name')
            .in('tournament_id', tIds);
          if (tournaments) {
            const tLookup: Record<string, string> = {};
            tournaments.forEach((t: any) => { tLookup[t.tournament_id] = t.tournament_name; });
            setTournamentLookup(tLookup);
          }
        }

        // Goles
        const matchIds = matchesList.map(m => m.match_id);
        if (matchIds.length > 0) {
          const { data: goalsData } = await supabase
            .from('goals')
            .select('*')
            .in('match_id', matchIds);
          if (goalsData) setGoals(goalsData as Goal[]);
        }

        // Equipos
        const teamIds = [...new Set([
          ...matchesList.map(m => m.home_id),
          ...matchesList.map(m => m.away_id),
        ])].filter(Boolean) as string[];

        if (teamIds.length > 0) {
          const { data: teams } = await supabase
            .from('teams')
            .select('team_id, team_name, team_crest_url')
            .in('team_id', teamIds);
          if (teams) {
            const lookup: Record<string, TeamInfo> = {};
            teams.forEach((t: TeamInfo) => { lookup[t.team_id] = t; });
            setTeamLookup(lookup);
          }
        }
      } catch (err) {
        console.error('Error initializing efemerides data:', err);
      } finally {
        setLoading(false);
      }
    }
    initData();
  }, []);

  // ── Filtrar y adaptar reactivamente ───────────────────────
  const { filteredMatches, filteredGoals, matchesByDate } = useMemo(() => {
    if (allMatches.length === 0) return { filteredMatches: [], filteredGoals: [], matchesByDate: {} };

    const parts = date.split('-');
    if (parts.length < 3) return { filteredMatches: [], filteredGoals: [], matchesByDate: {} };
    const mmdd = `${parts[1]}-${parts[2]}`;

    const aliases = getTeamAliases(teamLookup);

    // Filtrar por aniversario (mismo día y mes)
    const filtered = allMatches
      .filter(m => m.match_date && m.match_date.endsWith(mmdd))
      .sort((a, b) => {
        const yA = a.match_date ? parseInt(a.match_date.split('-')[0]) : 0;
        const yB = b.match_date ? parseInt(b.match_date.split('-')[0]) : 0;
        return yB - yA;
      });

    // Adaptar: alias + año como statusLabel + nombre de torneo en match_notes
    const adapted = filtered.map(m => {
      const hId = resolveTeamId(m.home_id || '', aliases);
      const aId = resolveTeamId(m.away_id || '', aliases);
      const year = m.match_date ? m.match_date.split('-')[0] : '✓';
      const tournamentName = m.tournament_id ? tournamentLookup[m.tournament_id] : null;

      return {
        ...m,
        home_id: hId,
        away_id: aId,
        home_name: hId !== m.home_id ? teamLookup[hId]?.team_name : m.home_name,
        away_name: aId !== m.away_id ? teamLookup[aId]?.team_name : m.away_name,
        match_status_label: <span className="text-[10px] font-normal">{year}</span>,
        match_notes: tournamentName
          ? `${tournamentName}${m.match_notes ? ` - ${m.match_notes}` : ''}`
          : m.match_notes,
      };
    });

    // Goles filtrados
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
  }, [allMatches, goals, date, tournamentLookup, teamLookup]);

  // ── Render ────────────────────────────────────────────────
  if (loading || filteredMatches.length === 0) return null;

  const targetDate = new Date(`${date}T12:00:00`);
  const formattedDate = targetDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });

  return (
    <FixtureTable
      roundName={`Efemérides del ${formattedDate}`}
      matchesByDate={matchesByDate}
      goals={filteredGoals}
      teamLookup={teamLookup}
      hideDateSeparators={true}
      sortDescending={true}
    />
  );
}
