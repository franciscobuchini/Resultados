import type { TabConfig } from '../tabTypes'
import type { Goal } from '../../functions/computeStandings'
import HistoryVsTable, { type HistoryStats } from '../../components/tables/HistoryVsTable'

export const tabConfig: TabConfig = {
  id: 'stats',
  label: 'Estadísticas',
  order: 4,
}

// ------------------------------------------------------------
// TIPOS
// ------------------------------------------------------------

interface MatchWithTournament {
  match_id: string
  home_id: string
  away_id: string
  match_status: string | null
  home_score: number | null
  away_score: number | null
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

interface EstadisticasTabProps {
  teamId: string
  matches: MatchWithTournament[]
  goals: Goal[]
  teamLookup: TeamLookup
}

// ------------------------------------------------------------
// COMPONENTE
// ------------------------------------------------------------

export default function EstadisticasTab({ teamId, matches, teamLookup }: EstadisticasTabProps) {
  // Lógica de historial por Rival
  const computeHistory = (matchList: MatchWithTournament[]): HistoryStats[] => {
    const statsMap: Record<string, HistoryStats> = {}

    matchList.forEach(m => {
      if (!isFinished(m.match_status)) return

      const cleanId = teamId.trim()
      const isHome = m.home_id === cleanId
      const rivalId = isHome ? m.away_id : m.home_id

      if (!rivalId) return

      if (!statsMap[rivalId]) {
        const info = teamLookup[rivalId]
        statsMap[rivalId] = {
          rivalId,
          rivalName: info?.team_name || 'Desconocido',
          rivalLogo: info?.team_crest_url || null,
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          diff: 0
        }
      }

      const s = statsMap[rivalId]
      s.played++

      const homeScore = m.home_score || 0
      const awayScore = m.away_score || 0

      if (homeScore === awayScore) {
        s.drawn++
      } else {
        const won = isHome ? (homeScore > awayScore) : (awayScore > homeScore)
        if (won) {
          s.won++
        } else {
          s.lost++
        }
      }
      s.diff = s.won - s.lost
    })

    return Object.values(statsMap)
  }

  const historyStats = computeHistory(matches)

  return (
    <div className="lg:col-span-2 flex flex-col gap-4">
      {historyStats.length > 0 ? (
        <HistoryVsTable stats={historyStats} />
      ) : null}
    </div>
  )
}
