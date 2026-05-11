import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../functions/supabase'
import PageBanner from '../layout/PageBanner'
import FixtureTable from '../components/tables/FixtureTable'
import Error404 from './Error404'
import { useThemeClasses } from '../functions/themeStore'
import { useTime, toLocal } from '../functions/time'
import HistoryTable, { type HistoryStats } from '../components/tables/HistoryTable'

// ------------------------------------------------------------
// TIPOS
// ------------------------------------------------------------

interface Team {
  team_id: string
  team_name: string
  team_fullname: string | null
  team_shortname: string | null
  team_crest_url: string | null
  team_banner_url?: string | null
}

interface MatchWithTournament {
  match_id: string
  tournament_id: string
  home_id: string
  away_id: string
  home_name: string | null
  away_name: string | null
  match_date: string
  match_time_utc: string | null
  match_status: string | null
  home_score: number | null
  away_score: number | null
  home_penalty: number | null
  away_penalty: number | null
  match_round: string | null
  tournaments: {
    tournament_name: string
  } | null
}

interface TeamLookup {
  [key: string]: {
    team_name: string
    team_crest_url: string | null
  }
}

// ------------------------------------------------------------
// HELPERS
// ------------------------------------------------------------

const isFinished = (status: string | null): boolean => {
  if (!status) return false
  const s = status.toLowerCase().trim()
  return ['ft', 'aet', 'pen', 'finalizado'].includes(s)
}



// ------------------------------------------------------------
// COMPONENTE
// ------------------------------------------------------------

export default function TeamPage() {
  const { teamId } = useParams<{ teamId: string }>()
  const [loading, setLoading] = useState(true)
  const [team, setTeam] = useState<Team | null>(null)
  const [matches, setMatches] = useState<MatchWithTournament[]>([])
  const [teamLookup, setTeamLookup] = useState<TeamLookup>({})
  const { utcOffset } = useTime()
  const { border, textMain, textMuted, bgSurface } = useThemeClasses()

  useEffect(() => {
    if (!teamId) return

    const fetchData = async () => {
      const cleanId = teamId.trim()
      setLoading(true)

      try {
        // 1. Traer datos del equipo
        const { data: teamData, error: teamError } = await supabase
          .from('teams')
          .select('*')
          .eq('team_id', cleanId)
          .maybeSingle()

        if (teamError || !teamData) {
          setLoading(false)
          return
        }
        setTeam(teamData as Team)

        // 2. Traer todos los partidos vinculados al equipo
        const { data: matchData } = await supabase
          .from('matches')
          .select('*')
          .or(`home_id.eq.${cleanId},away_id.eq.${cleanId}`)
          .order('match_date', { ascending: false })

        let fetchedMatches = (matchData || []) as MatchWithTournament[]

        // Fallback: Si no hay partidos por ID, intentamos por nombre
        if (fetchedMatches.length === 0 && teamData.team_name) {
          const { data: nameMatchData } = await supabase
            .from('matches')
            .select('*')
            .or(`home_name.eq."${teamData.team_name}",away_name.eq."${teamData.team_name}"`)
            .order('match_date', { ascending: false })

          if (nameMatchData && nameMatchData.length > 0) {
            fetchedMatches = nameMatchData as MatchWithTournament[]
          }
        }

        setMatches(fetchedMatches)

        // 3. Crear el lookup de equipos (incluyendo rivales)
        const rivalIds = Array.from(new Set([
          ...fetchedMatches.map(m => m.home_id),
          ...fetchedMatches.map(m => m.away_id)
        ])).filter(id => id && id !== cleanId) as string[]

        const lookup: TeamLookup = {
          [cleanId]: {
            team_name: teamData.team_name,
            team_crest_url: teamData.team_crest_url
          }
        }

        if (rivalIds.length > 0) {
          const { data: rivalData } = await supabase
            .from('teams')
            .select('team_id, team_name, team_crest_url')
            .in('team_id', rivalIds)

          if (rivalData) {
            rivalData.forEach(t => {
              lookup[t.team_id] = {
                team_name: t.team_name,
                team_crest_url: t.team_crest_url
              }
            })
          }
        }
        setTeamLookup(lookup)
      } catch (error) {
        console.error('Error fetching team data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [teamId])

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className={`w-12 h-12 border-4 ${border} border-t-current ${textMain} rounded-full animate-spin`} />
    </div>
  )

  if (!team) return <Error404 />

  // Helpers para el agrupamiento por fecha LOCAL
  const groupMatches = (matchList: MatchWithTournament[]) => {
    const grouped: Record<string, MatchWithTournament[]> = {}
    matchList.forEach(m => {
      if (!m.match_date) return
      const local = toLocal(m.match_date, m.match_time_utc, utcOffset)
      const dateKey = local.date
      if (dateKey) {
        if (!grouped[dateKey]) grouped[dateKey] = []
        grouped[dateKey].push(m)
      }
    })
    return grouped
  }

  // Lógica de historial por Rival
  const computeHistory = (matchList: MatchWithTournament[]): HistoryStats[] => {
    if (!teamId) return [];
    const statsMap: Record<string, HistoryStats> = {};

    matchList.forEach(m => {
      if (!isFinished(m.match_status)) return;

      const cleanId = teamId.trim();
      const isHome = m.home_id === cleanId;
      const rivalId = isHome ? m.away_id : m.home_id;

      if (!rivalId) return;

      if (!statsMap[rivalId]) {
        const info = teamLookup[rivalId];
        statsMap[rivalId] = {
          rivalId,
          rivalName: info?.team_name || 'Desconocido',
          rivalLogo: info?.team_crest_url || null,
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          diff: 0
        };
      }

      const s = statsMap[rivalId];
      s.played++;

      const homeScore = m.home_score || 0;
      const awayScore = m.away_score || 0;

      if (homeScore === awayScore) {
        s.drawn++;
      } else {
        const won = isHome ? (homeScore > awayScore) : (awayScore > homeScore);
        if (won) {
          s.won++;
        } else {
          s.lost++;
        }
      }
      s.diff = s.won - s.lost;
    });

    return Object.values(statsMap);
  };

  // Separar partidos
  const finishedMatches = matches.filter(m => isFinished(m.match_status)).slice(0, 6)
  const upcomingMatches = [...matches.filter(m => !isFinished(m.match_status))].reverse()

  const groupedFinished = groupMatches(finishedMatches)
  const groupedUpcoming = groupMatches(upcomingMatches)
  const historyStats = computeHistory(matches);

  return (
    <>
      <PageBanner
        title={team.team_fullname || team.team_name}
        tournament_banner_url={team.team_banner_url || null}
        logo={team.team_crest_url}
      />

      <div className="max-w-[1400px] mx-auto p-2 md:p-8 flex flex-col gap-12">

        {/* Fila superior: Próximos y Últimos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Próximos Partidos */}
          <div className="flex flex-col gap-4">
            {upcomingMatches.length > 0 ? (
              <FixtureTable
                roundName="Próximos Partidos"
                matchesByDate={groupedUpcoming}
                teamLookup={teamLookup}
                fullDate={true}
              />
            ) : (
              <div className={`p-12 text-center ${textMuted} italic ${bgSurface} rounded-2xl border ${border}`}>
                No hay próximos partidos programados para este equipo
              </div>
            )}
          </div>

          {/* Últimos Resultados */}
          <div className="flex flex-col gap-4">
            {finishedMatches.length > 0 ? (
              <FixtureTable
                roundName="Últimos Resultados"
                matchesByDate={groupedFinished}
                teamLookup={teamLookup}
                hideDateSeparators={true}
                sortDescending={true}
              />
            ) : (
              <div className={`p-12 text-center ${textMuted} italic ${bgSurface} rounded-2xl border ${border}`}>
                No hay resultados recientes para este equipo
              </div>
            )}
          </div>
        </div>

        {/* Fila inferior: Historial por Rival */}
        {historyStats.length > 0 && (
          <div className="flex flex-col gap-4">
            <HistoryTable stats={historyStats} />
          </div>
        )}

      </div>
    </>
  )
}
