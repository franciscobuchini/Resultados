import { useEffect, useState } from 'react';
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

export default function Efemerides() {
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState<Match[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [teamLookup, setTeamLookup] = useState<Record<string, TeamInfo>>({});

  useEffect(() => {
    async function fetchEfemerides() {
      try {
        // 1. Obtener hoy (MM-DD)
        const today = new Date();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const mmdd = `${month}-${day}`;

        // 2. Traer todos los partidos de mundiales
        const { data: allMatches, error: matchesError } = await supabase
          .from('matches')
          .select('*')
          .like('tournament_id', 'INT%WC');

        if (matchesError || !allMatches) {
          setLoading(false);
          return;
        }

        // 3. Filtrar partidos jugados el mismo día y mes
        const anniversaryMatches = (allMatches as Match[]).filter(
          m => m.match_date && m.match_date.endsWith(mmdd)
        );

        if (anniversaryMatches.length === 0) {
          setLoading(false);
          return;
        }

        // Ordenar por año descendente para ver los más recientes primero
        anniversaryMatches.sort((a, b) => {
          const yearA = a.match_date ? parseInt(a.match_date.split('-')[0]) : 0;
          const yearB = b.match_date ? parseInt(b.match_date.split('-')[0]) : 0;
          return yearB - yearA;
        });

        // 4. Traer información de torneos (para los nombres de los mundiales)
        const tournamentIds = Array.from(new Set(anniversaryMatches.map(m => m.tournament_id).filter(Boolean))) as string[];
        let tournamentLookup: Record<string, string> = {};

        if (tournamentIds.length > 0) {
          const { data: tournaments } = await supabase
            .from('tournaments')
            .select('tournament_id, tournament_name')
            .in('tournament_id', tournamentIds);

          if (tournaments) {
            tournaments.forEach((t: TournamentInfo) => {
              tournamentLookup[t.tournament_id] = t.tournament_name;
            });
          }
        }

        // 5. Traer goles de estos partidos
        const matchIds = anniversaryMatches.map(m => m.match_id);
        const { data: goalsData } = await supabase
          .from('goals')
          .select('*')
          .in('match_id', matchIds);

        if (goalsData) {
          setGoals(goalsData as Goal[]);
        }

        // 6. Traer información de equipos
        const teamIds = Array.from(
          new Set([
            ...anniversaryMatches.map(m => m.home_id),
            ...anniversaryMatches.map(m => m.away_id),
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

        // 7. Adaptar partidos (guardar nombre del mundial en match_notes)
        const adaptedMatches = anniversaryMatches.map(m => {
          const tournamentName = m.tournament_id ? tournamentLookup[m.tournament_id] : null;

          return {
            ...m,
            // Mostramos el nombre del mundial en las notas de detalle del partido
            match_notes: tournamentName 
              ? `${tournamentName}${m.match_notes ? ` - ${m.match_notes}` : ''}`
              : m.match_notes
          };
        });

        setMatches(adaptedMatches);
      } catch (err) {
        console.error('Error fetching efemerides matches:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchEfemerides();
  }, []);

  if (loading || matches.length === 0) {
    return null;
  }

  // Agrupar por la fecha del partido para que FixtureTable pueda subdividir por fecha/año
  const matchesByDate: Record<string, Match[]> = {};
  matches.forEach(m => {
    if (!m.match_date) return;
    if (!matchesByDate[m.match_date]) {
      matchesByDate[m.match_date] = [];
    }
    matchesByDate[m.match_date].push(m);
  });

  const formattedToday = new Date().toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
  });

  const roundHeader = (
    <div >
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
