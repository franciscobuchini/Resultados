import { useEffect, useState } from 'react'
import type { TabConfig } from '../tabTypes'
import { supabase } from '../../functions/supabase'
import EmptyState from '../../components/ui/EmptyState'
import LoadingState from '../../components/ui/LoadingState'
import HistoricalTable from '../../components/tables/HistoricalTable'
import type { HistoricalTeamStanding } from '../../components/tables/HistoricalTable'

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

/** Deriva la "base" de un tournament_id: PREFIX + primer char del sufijo */
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

  useEffect(() => {
    async function loadHistorical() {
      setHistLoading(true)
      const base = getCompetitionBase(tournamentId)
      if (!base) { setHistLoading(false); return }

      // Buscar todos los torneos hermanos con el mismo prefijo y sufijo
      const { data: siblings } = await supabase
        .from('tournaments')
        .select('tournament_id, tournament_name')
        .ilike('tournament_id', `${base.prefix}.%.${base.suffix}`)

      if (!siblings || siblings.length === 0) { setHistLoading(false); return }

      const siblingIds = siblings.map(s => s.tournament_id)

      // Traer TODOS los partidos de todas las ediciones (paginado de a 1000 para evitar el límite de Supabase/PostgREST)
      let allMatches: any[] = []
      let page = 0
      const pageSize = 1000
      
      while (true) {
        const { data: matchesChunk, error } = await supabase
          .from('matches')
          .select('tournament_id, home_id, home_name, away_id, away_name, home_score, away_score, match_status')
          .in('tournament_id', siblingIds)
          .range(page * pageSize, (page + 1) * pageSize - 1)
        
        if (error) {
          console.error('Error fetching matches chunk:', error)
          break
        }
        if (!matchesChunk || matchesChunk.length === 0) break
        allMatches = allMatches.concat(matchesChunk)
        if (matchesChunk.length < pageSize) break
        page++
      }

      if (allMatches.length === 0) { setHistLoading(false); return }

      // Traer equipos para escudos y armar el teamLookup
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

      // Calcular standings
      const sm: Record<string, { teamName: string; teamId: string; tjSet: Set<string>; pts: number; pj: number; pg: number; pe: number; pp: number; gf: number; gc: number; titles: number }> = {}

      const ensure = (name: string, id: string, tid: string) => {
        const norm = normalizeTeamName(name)
        if (!sm[norm]) sm[norm] = { teamName: norm, teamId: idByName[norm] || id || '', tjSet: new Set(), pts: 0, pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, titles: 0 }
        if (tid) sm[norm].tjSet.add(tid)
        return sm[norm]
      }

      for (const m of allMatches) {
        if (!isFinished(m.match_status) || !m.home_name || !m.away_name) continue
        const h = ensure(m.home_name, m.home_id, m.tournament_id)
        const a = ensure(m.away_name, m.away_id, m.tournament_id)
        const hs = m.home_score ?? 0, as_ = m.away_score ?? 0
        
        h.pj++; a.pj++; h.gf += hs; h.gc += as_; a.gf += as_; a.gc += hs
        if (hs > as_) { h.pg++; h.pts += 3; a.pp++ }
        else if (hs < as_) { a.pg++; a.pts += 3; h.pp++ }
        else { h.pe++; h.pts += 1; a.pe++; a.pts += 1 }
      }

      // Títulos (solo mundiales por ahora)
      if (base.suffix === 'WC') {
        const WC_CHAMPIONS: Record<string, string> = {
          'INT.1930.WC': 'Uruguay', 'INT.1934.WC': 'Italia', 'INT.1938.WC': 'Italia',
          'INT.1950.WC': 'Uruguay', 'INT.1954.WC': 'Alemania', 'INT.1958.WC': 'Brasil',
          'INT.1962.WC': 'Brasil', 'INT.1966.WC': 'Inglaterra', 'INT.1970.WC': 'Brasil',
          'INT.1974.WC': 'Alemania', 'INT.1978.WC': 'Argentina', 'INT.1982.WC': 'Italia',
          'INT.1986.WC': 'Argentina', 'INT.1990.WC': 'Alemania', 'INT.1994.WC': 'Brasil',
          'INT.1998.WC': 'Francia', 'INT.2002.WC': 'Brasil', 'INT.2006.WC': 'Italia',
          'INT.2010.WC': 'España', 'INT.2014.WC': 'Alemania', 'INT.2018.WC': 'Francia',
          'INT.2022.WC': 'Argentina',
        }
        Object.values(WC_CHAMPIONS).forEach(champ => {
          const n = normalizeTeamName(champ)
          if (sm[n]) sm[n].titles++
        })
      }

      const sorted: HistoricalTeamStanding[] = Object.values(sm).map(s => ({
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

  if (histLoading) return <LoadingState fullHeight />

  if (historicalStandings.length === 0) {
    return <div className="py-12"><EmptyState message="Las estadísticas estarán disponibles una vez que comiencen los partidos." className="h-64" /></div>
  }

  return (
    <div className="flex flex-col gap-8">
      <HistoricalTable
        standings={historicalStandings}
        teamLookup={teamLookup}
      />
    </div>
  )
}
