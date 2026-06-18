import { useEffect, useState } from 'react'
import type { TabConfig } from '../tabTypes'
import { supabase } from '../../functions/supabase'
import EmptyState from '../../components/ui/EmptyState'
import LoadingState from '../../components/ui/LoadingState'
import HistoricalTable from '../../components/tables/HistoricalTable'
import type { HistoricalTeamStanding } from '../../components/tables/HistoricalTable'
import TopScorersTable from '../../components/tables/TopScorersTable'
import { getTopScorers, type TopScorer } from '../../functions/topScorers'
import { LAYOUT_CONFIG } from '../../functions/layoutConfig'

export const tabConfig: TabConfig = {
  id: 'stats',
  label: 'Estadísticas',
  order: 2,
}

// ------------------------------------------------------------
// HELPERS
// ------------------------------------------------------------

const isFinished = (status: string | null): boolean => {
  if (!status) return false
  const s = status.toLowerCase().trim()
  return ['ft', 'aet', 'pen', 'finalizado'].includes(s)
}

const normalizeTeamName = (name: string): string => {
  if (!name) return ''
  const trim = name.trim()
  if (trim === 'Alemania Federal') return 'Alemania'
  if (trim === 'Rep. Checa') return 'República Checa'
  if (trim === 'Bosnia') return 'Bosnia y Herzegovina'
  return trim
}

const getCompetitionBase = (tournamentId: string): { prefix: string; suffix: string } | null => {
  const parts = tournamentId.split('.')
  if (parts.length < 3) return null
  return { prefix: parts[0], suffix: parts[2] }
}

// ------------------------------------------------------------
// TYPES
// ------------------------------------------------------------

interface EstadisticasTabProps {
  tournamentId: string
}

interface TeamInfo {
  team_id: string
  team_name: string | null
  team_crest_url: string | null
}

// ------------------------------------------------------------
// COMPONENTE
// ------------------------------------------------------------

export default function EstadisticasTab({ tournamentId }: EstadisticasTabProps) {
  const [historicalStandings, setHistoricalStandings] = useState<HistoricalTeamStanding[]>([])
  const [teamLookup, setTeamLookup] = useState<Record<string, TeamInfo>>({})
  const [histLoading, setHistLoading] = useState(true)
  const [topScorers, setTopScorers] = useState<TopScorer[]>([])
  const [scorersLoading, setScorersLoading] = useState(true)

  useEffect(() => {
    async function loadHistorical() {
      setHistLoading(true)
      const base = getCompetitionBase(tournamentId)
      if (!base) { setHistLoading(false); return }

      const { data: siblings } = await supabase
        .from('tournaments')
        .select('tournament_id, tournament_name, tournament_winner_id')
        .ilike('tournament_id', `${base.prefix}.%.${base.suffix}`)

      if (!siblings || siblings.length === 0) { setHistLoading(false); return }

      const siblingIds = siblings.map(s => s.tournament_id)

      let allMatches: any[] = []
      let page = 0
      const pageSize = 1000

      while (true) {
        const { data: matchesChunk, error } = await supabase
          .from('matches')
          .select('tournament_id, home_id, home_name, away_id, away_name, home_score, away_score, match_status')
          .in('tournament_id', siblingIds)
          .range(page * pageSize, (page + 1) * pageSize - 1)

        if (error) { break }
        if (!matchesChunk || matchesChunk.length === 0) break
        allMatches = allMatches.concat(matchesChunk)
        if (matchesChunk.length < pageSize) break
        page++
      }

      if (allMatches.length === 0) { setHistLoading(false); return }

      const { data: teams } = await supabase.from('teams').select('team_id, team_name, team_crest_url')
      const idByName: Record<string, string> = {}
      const newTeamLookup: Record<string, TeamInfo> = {}

      teams?.forEach(t => {
        const norm = normalizeTeamName(t.team_name || '')
        idByName[norm] = t.team_id
        newTeamLookup[t.team_id] = {
          team_id: t.team_id,
          team_name: norm,
          team_crest_url: t.team_crest_url
        }
      })
      setTeamLookup(newTeamLookup)

      const sm: Record<string, { teamName: string; teamId: string; tjSet: Set<string>; pts: number; pj: number; pg: number; pe: number; pp: number; gf: number; gc: number; titles: number }> = {}

      // Equipos que se combinan en el historial
      const TEAM_ALIASES: Record<string, string> = {}

      const ensure = (id: string, name: string, tid: string) => {
        const resolvedId = TEAM_ALIASES[id] ?? id
        if (!resolvedId) return null
        if (!sm[resolvedId]) sm[resolvedId] = { teamName: normalizeTeamName(name), teamId: resolvedId, tjSet: new Set(), pts: 0, pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, titles: 0 }
        if (tid) sm[resolvedId].tjSet.add(tid)
        return sm[resolvedId]
      }

      for (const m of allMatches) {
        if (!isFinished(m.match_status) || !m.home_id || !m.away_id) continue

        const hs = m.home_score ?? 0
        const as_ = m.away_score ?? 0

        // Caso especial: mismo equipo en ambos lados (Alemania tras fusionar Alemania del Este)
        // La Alemania oficial era el away → se registra su perspectiva: derrota 0-1
        if (m.home_id === m.away_id) {
          const team = ensure(m.home_id, m.away_name || m.home_name || '', m.tournament_id)
          if (!team) continue
          team.pj++
          team.pp++
          team.gf += as_  // goles de Alemania oficial (away)
          team.gc += hs   // goles en contra
          continue
        }

        const h = ensure(m.home_id, m.home_name || '', m.tournament_id)
        const a = ensure(m.away_id, m.away_name || '', m.tournament_id)
        if (!h || !a) continue

        h.pj++; a.pj++; h.gf += hs; h.gc += as_; a.gf += as_; a.gc += hs
        if (hs > as_) { h.pg++; h.pts += 3; a.pp++ }
        else if (hs < as_) { a.pg++; a.pts += 3; h.pp++ }
        else { h.pe++; h.pts += 1; a.pe++; a.pts += 1 }
      }

      siblings.forEach(s => {
        if (!s.tournament_winner_id) return
        if (sm[s.tournament_winner_id]) sm[s.tournament_winner_id].titles++
      })

      const sorted: HistoricalTeamStanding[] = Object.values(sm)
        .filter(s => s.teamId !== 'INT217')
        .map(s => ({
          team_id: s.teamId,
          team_name: s.teamName,
          played: s.pj,
          won: s.pg,
          drawn: s.pe,
          lost: s.pp,
          goals_for: s.gf,
          goals_against: s.gc,
          goal_difference: s.gf - s.gc,
          points: s.pts,
          tj: s.tjSet.size,
          titles: s.titles,
          rend: s.pj > 0 ? (s.pts / (s.pj * 3)) * 100 : 0
        })).sort((a, b) => b.points - a.points || b.goal_difference - a.goal_difference || b.goals_for - a.goals_for || a.played - b.played)

      setHistoricalStandings(sorted)
      setHistLoading(false)
    }

    loadHistorical()
  }, [tournamentId])

  // Cargar goleadores desde la tabla apis
  useEffect(() => {
    async function loadTopScorers() {
      setScorersLoading(true)
      const data = await getTopScorers()
      setTopScorers(data)
      setScorersLoading(false)
    }
    loadTopScorers()
  }, [])

  if (histLoading || scorersLoading) return <LoadingState fullHeight />

  if (historicalStandings.length === 0 && topScorers.length === 0) {
    return <div className="py-12"><EmptyState message="Las estadísticas estarán disponibles una vez que comiencen los partidos." className="h-64" /></div>
  }

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-[2fr_1fr] ${LAYOUT_CONFIG.gapGrid}`}>
      {historicalStandings.length > 0 && (
        <div className="order-1">
          <HistoricalTable
            standings={historicalStandings}
            teamLookup={teamLookup}
          />
        </div>
      )}

      {topScorers.length > 0 && (
        <div className="order-2">
          <TopScorersTable
            scorers={topScorers}
            teamLookup={teamLookup}
          />
        </div>
      )}

    </div>
  )
}