import type { TabConfig } from '../tabTypes'
import type { Goal } from '../../functions/computeStandings'
import FixtureTable from '../../components/tables/FixtureTable'
import EmptyState from '../../components/ui/EmptyState'
import { useTime, toLocal } from '../../functions/time'
import { getMatchStatusLabel } from '../../functions/matchHelpers'

export const tabConfig: TabConfig = {
  id: 'matches',
  label: 'Partidos',
  order: 1,
}

// ------------------------------------------------------------
// TIPOS
// ------------------------------------------------------------

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
  match_status_label?: string | React.ReactNode | null
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
// PROPS
// ------------------------------------------------------------

interface PartidosTabProps {
  teamId: string
  matches: MatchWithTournament[]
  goals: Goal[]
  teamLookup: TeamLookup
}

// ------------------------------------------------------------
// COMPONENTE
// ------------------------------------------------------------

export default function PartidosTab({ matches, goals, teamLookup }: PartidosTabProps) {
  const { utcOffset } = useTime()

  // Helper para agrupar por fecha local
  const groupMatches = (matchList: MatchWithTournament[], isResults: boolean = false) => {
    const grouped: Record<string, MatchWithTournament[]> = {}
    matchList.forEach(m => {
      if (!m.match_date) return
      const local = toLocal(m.match_date, m.match_time_utc, utcOffset)
      const dateKey = local.date
      if (dateKey) {
        if (!grouped[dateKey]) grouped[dateKey] = []
        const originalLabel = getMatchStatusLabel(m.match_status, m.match_date)
        const year = m.match_date ? m.match_date.split('-')[0] : ''

        const matchWithLabel: MatchWithTournament = {
          ...m,
          match_status_label: isResults ? (
            <div className="flex flex-col items-center leading-tight">
              <span className="text-[10px] font-normal">{year}</span>
              <span>{originalLabel}</span>
            </div>
          ) : originalLabel
        }
        grouped[dateKey].push(matchWithLabel)
      }
    })
    return grouped
  }

  // Separar partidos
  const finishedMatches = matches.filter(m => isFinished(m.match_status)).slice(0, 6)
  const upcomingMatches = [...matches.filter(m => !isFinished(m.match_status))].reverse()

  const groupedFinished = groupMatches(finishedMatches, true)
  const groupedUpcoming = groupMatches(upcomingMatches, false)

  return (
    <>
      {/* Próximos Partidos */}
      <div className="flex flex-col gap-4">
        {upcomingMatches.length > 0 ? (
          <FixtureTable
            roundName="Próximos Partidos"
            matchesByDate={groupedUpcoming}
            goals={goals}
            teamLookup={teamLookup}
            fullDate={true}
          />
        ) : (
          <EmptyState message="No hay próximos partidos programados para este equipo" />
        )}
      </div>

      {/* Últimos Resultados */}
      <div className="flex flex-col gap-4">
        {finishedMatches.length > 0 ? (
          <FixtureTable
            roundName="Últimos Resultados"
            matchesByDate={groupedFinished}
            goals={goals}
            teamLookup={teamLookup}
            hideDateSeparators={true}
            sortDescending={true}
          />
        ) : (
          <EmptyState message="No hay resultados recientes para este equipo" />
        )}
      </div>
    </>
  )
}
