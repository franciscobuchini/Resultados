import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../../functions/supabase';
import FixtureTable from '../tables/FixtureTable';
import type { Match, Goal } from '../../functions/computeStandings';

interface TournamentInfo {
  tournament_id: string;
  tournament_name: string;
}

interface TeamInfo {
  team_id: string;
  team_name: string;
  team_crest_url: string | null;
}

export default function Efemerides({ date }: { date: string }) {
  const [loading, setLoading] = useState(true);
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [teamLookup, setTeamLookup] = useState<Record<string, TeamInfo>>({});
  const [tournamentLookup, setTournamentLookup] = useState<Record<string, string>>({});

  useEffect(() => {
    async function initData() {
      try {
        // 1. Traer todos los partidos de mundiales
        const { data: matchesData, error: matchesError } = await supabase
          .from('matches')
          .select('*')
          .like('tournament_id', 'INT%WC');

        if (matchesError || !matchesData) {
          setLoading(false);
          return;
        }

        const matchesList = matchesData as Match[];
        setAllMatches(matchesList);

        // 2. Traer nombres de todos los mundiales
        const tournamentIds = Array.from(new Set(matchesList.map(m => m.tournament_id).filter(Boolean))) as string[];
        if (tournamentIds.length > 0) {
          const { data: tournaments } = await supabase
            .from('tournaments')
            .select('tournament_id, tournament_name')
            .in('tournament_id', tournamentIds);

          if (tournaments) {
            const tLookup: Record<string, string> = {};
            tournaments.forEach((t: TournamentInfo) => {
              tLookup[t.tournament_id] = t.tournament_name;
            });
            setTournamentLookup(tLookup);
          }
        }

        // 3. Traer goles de todos los partidos
        const matchIds = matchesList.map(m => m.match_id);
        if (matchIds.length > 0) {
          const { data: goalsData } = await supabase
            .from('goals')
            .select('*')
            .in('match_id', matchIds);

          if (goalsData) {
            setGoals(goalsData as Goal[]);
          }
        }

        // 4. Traer información de todos los equipos
        const teamIds = Array.from(
          new Set([
            ...matchesList.map(m => m.home_id),
            ...matchesList.map(m => m.away_id),
          ])
        ).filter(Boolean) as string[];

        if (teamIds.length > 0) {
          const { data: teams } = await supabase
            .from('teams')
            .select('team_id, team_name, team_crest_url')
            .in('team_id', teamIds);

          if (teams) {
            const lookup: Record<string, TeamInfo> = {};
            teams.forEach((t: TeamInfo) => {
              lookup[t.team_id] = t;
            });
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

  // Filtrar y agrupar reactivamente al cambiar la fecha
  const { filteredMatches, matchesByDate } = useMemo(() => {
    if (allMatches.length === 0) {
      return { filteredMatches: [], matchesByDate: {} };
    }

    // Extraer mes y día de la prop 'date' (formato YYYY-MM-DD)
    const parts = date.split('-');
    if (parts.length < 3) {
      return { filteredMatches: [], matchesByDate: {} };
    }
    const mmdd = `${parts[1]}-${parts[2]}`;

    // Filtrar partidos que coincidan en el aniversario (mismo día y mes)
    const filtered = allMatches.filter(m => m.match_date && m.match_date.endsWith(mmdd));

    // Ordenar por año descendente
    filtered.sort((a, b) => {
      const yearA = a.match_date ? parseInt(a.match_date.split('-')[0]) : 0;
      const yearB = b.match_date ? parseInt(b.match_date.split('-')[0]) : 0;
      return yearB - yearA;
    });

    // Adaptar partidos con las notas de torneo
    const adapted = filtered.map(m => {
      const tournamentName = m.tournament_id ? tournamentLookup[m.tournament_id] : null;
      return {
        ...m,
        match_notes: tournamentName
          ? `${tournamentName}${m.match_notes ? ` - ${m.match_notes}` : ''}`
          : m.match_notes
      };
    });

    // Agrupar por fecha para los separadores
    const grouped: Record<string, Match[]> = {};
    adapted.forEach(m => {
      if (!m.match_date) return;
      if (!grouped[m.match_date]) {
        grouped[m.match_date] = [];
      }
      grouped[m.match_date].push(m);
    });

    return { filteredMatches: adapted, matchesByDate: grouped };
  }, [allMatches, date, tournamentLookup]);

  if (loading || filteredMatches.length === 0) {
    return null;
  }

  // Formatear la fecha seleccionada en español ("5 de junio")
  const targetDate = new Date(`${date}T12:00:00`);
  const formattedToday = targetDate.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
  });

  const roundHeader = (
    <div>
      <span>Efemérides del {formattedToday}</span>
    </div>
  );

  return (
    <div className="w-full flex flex-col">
      <FixtureTable
        roundName={roundHeader}
        matchesByDate={matchesByDate}
        goals={goals}
        teamLookup={teamLookup}
        hideDateSeparators={false}
        showYearInSeparator={true}
        sortDescending={true}
      />
    </div>
  );
}
