import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../functions/supabase'
import PageBanner from '../../layout/PageBanner'
import PageContent from '../../layout/PageContent'
import Error404 from '../Error404'
import type { Match, Goal } from '../../functions/computeStandings'
import type { TournamentSystem } from '../../functions/computeStandings'
import { useTheme } from '../../functions/themeStore'
import LoadingState from '../../components/ui/LoadingState'
import PageHeader from '../../layout/PageHeader'
import ChampionBanner from '../../components/ui/ChampionBanner'
import { resolveTabModules } from '../tabTypes'

// ------------------------------------------------------------
// AUTO-DISCOVERY DE TABS
// ------------------------------------------------------------

const tabModules = resolveTabModules(
  import.meta.glob('./*.tab.tsx', { eager: true })
)

// ------------------------------------------------------------
// TIPOS
// ------------------------------------------------------------

interface TeamInfo {
  team_id: string
  team_name: string
  team_shortname: string | null
  team_crest_url: string | null
}

interface Tournament {
  tournament_id: string
  tournament_name: string
  tournament_crest_url: string | null
  tournament_banner_url: string | null
  tournament_teams: Record<string, string[]> | null
  tournament_system: TournamentSystem | null
  tournament_winner_id: string | null
}

// ------------------------------------------------------------
// HELPERS
// ------------------------------------------------------------

const isMatchday = (round: string): boolean =>
  /^\d+$/.test(round.trim()) || /^fecha\s+\d+$/i.test(round.trim())

const matchdayNumber = (round: string): number => {
  const pure = round.trim().match(/^(\d+)$/)
  if (pure) return parseInt(pure[1])
  const fechaN = round.trim().match(/^fecha\s+(\d+)$/i)
  if (fechaN) return parseInt(fechaN[1])
  return Infinity
}

// ------------------------------------------------------------
// COMPONENTE
// ------------------------------------------------------------

export default function TournamentPage() {
  const { tournamentId } = useParams<{ tournamentId: string }>()
  const [loading, setLoading] = useState(true)
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [matches, setMatches] = useState<Match[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [teamLookup, setTeamLookup] = useState<Record<string, TeamInfo>>({})
  const [selectedRound, setSelectedRound] = useState<string | null>(null)
  const setLastTournamentId = useTheme(state => state.setLastTournamentId)

  // Tab activa — por defecto la primera descubierta
  const [activeTab, setActiveTab] = useState(tabModules[0]?.tabConfig.id ?? 'tournament')

  // Datos para la pestaña de Ediciones
  const [historyTournaments, setHistoryTournaments] = useState<{ tournament_id: string; tournament_name: string; tournament_crest_url: string | null }[]>([])
  const navigate = useNavigate()

  // Construir array de tabs para PageHeader desde los módulos descubiertos
  const headerTabs = tabModules.map(m => ({
    id: m.tabConfig.id,
    label: m.tabConfig.label,
    disabled: m.tabConfig.disabled,
  }))

  useEffect(() => {
    if (!tournamentId) return
    setLastTournamentId(tournamentId)

    const fetchData = async () => {
      setLoading(true)

      const { data: tournaments } = await supabase
        .from('tournaments')
        .select('tournament_id, tournament_name, tournament_crest_url, tournament_banner_url, tournament_teams, tournament_system, tournament_winner_id')
        .eq('tournament_id', tournamentId)
        .limit(1)

      if (!tournaments || tournaments.length === 0) {
        setLoading(false)
        return
      }

      const tourney = tournaments[0] as Tournament
      setTournament(tourney)

      // Buscar ediciones históricas
      const tId = tourney.tournament_id.trim()
      const prefix = tId.substring(0, 3)
      const penultimate = tId.charAt(tId.length - 2)

      const { data: history } = await supabase
        .from('tournaments')
        .select('tournament_id, tournament_name, tournament_crest_url')
        .ilike('tournament_id', `${prefix}.%`)

      if (history) {
        let filtered = history.filter(t => {
          const otherId = t.tournament_id.trim()
          if (otherId.length < 4) return false
          const otherPenultimate = otherId.charAt(otherId.length - 2)
          return otherPenultimate === penultimate
        })

        // Asegurar que el torneo actual esté en la lista
        const currentInList = filtered.find(t => t.tournament_id === tournamentId)
        if (!currentInList && tourney) {
          filtered.push({
            tournament_id: tourney.tournament_id,
            tournament_name: tourney.tournament_name,
            tournament_crest_url: tourney.tournament_crest_url
          })
        }

        filtered.sort((a, b) => b.tournament_id.localeCompare(a.tournament_id))
        setHistoryTournaments(filtered)
      }

      const { data: matchData } = await supabase
        .from('matches')
        .select('*')
        .eq('tournament_id', tournamentId)
        .order('match_date', { ascending: true })
        .order('match_time_utc', { ascending: true })

      const fetchedMatches = (matchData || []) as Match[]
      setMatches(fetchedMatches)

      // Traer goles
      const matchIds = fetchedMatches.map(m => m.match_id)
      if (matchIds.length > 0) {
        const { data: goalData } = await supabase
          .from('goals')
          .select('*')
          .in('match_id', matchIds)
          .order('goal_minute', { ascending: true })

        if (goalData) {
          setGoals(goalData as Goal[])
        }
      }

      // Seleccionar la primera fecha disponible por defecto
      const rounds = Array.from(new Set(fetchedMatches.map(m => m.match_round).filter(Boolean))) as string[]
      const firstMatchday = rounds.filter(isMatchday).sort((a, b) => matchdayNumber(a) - matchdayNumber(b))[0]
      setSelectedRound(firstMatchday ?? rounds[0] ?? null)

      // Traer info de equipos
      const teamIds = Array.from(new Set([
        ...fetchedMatches.map(m => m.home_id),
        ...fetchedMatches.map(m => m.away_id)
      ])).filter(Boolean) as string[]

      if (teamIds.length > 0) {
        const { data: teams } = await supabase
          .from('teams')
          .select('team_id, team_name, team_shortname, team_crest_url')
          .in('team_id', teamIds)

        if (teams) {
          const lookup: Record<string, TeamInfo> = {}
          teams.forEach(t => { lookup[t.team_id] = t as TeamInfo })
          setTeamLookup(lookup)
        }
      }

      setLoading(false)
    }

    fetchData()
  }, [tournamentId])

  // ------------------------------------------------------------
  // ESTADOS DE CARGA Y ERROR
  // ------------------------------------------------------------

  if (loading) return <LoadingState fullHeight />
  if (!tournament) return <Error404 />

  // ------------------------------------------------------------
  // PROPS PARA CADA TAB
  // ------------------------------------------------------------

  const tabProps: Record<string, any> = {
    tournament: {
      tournament,
      matches,
      goals,
      teamLookup,
      selectedRound,
      setSelectedRound,
    },
    stats: {
      tournamentId,
      matches,
      goals,
      teamLookup,
    },
    editions: {
      tournamentId,
      historyTournaments,
      navigate,
      setActiveTab,
    },
  }

  // Buscar el módulo activo
  const activeModule = tabModules.find(m => m.tabConfig.id === activeTab) ?? tabModules[0]
  const ActiveComponent = activeModule?.default

  const winner = tournament.tournament_winner_id
    ? teamLookup[tournament.tournament_winner_id]
    : null

  return (
    <>
      <PageBanner
        title={tournament.tournament_name}
        tournament_banner_url={tournament.tournament_banner_url}
        logo={tournament.tournament_crest_url}
      >
        <PageHeader
          tabs={headerTabs}
          activeTabId={activeTab}
          onChange={setActiveTab}
        />
      </PageBanner>

      {winner && (
        <ChampionBanner
          teamName={winner.team_name}
          teamCrestUrl={winner.team_crest_url}
        />
      )}

      <PageContent maxWidth="1600">
        {ActiveComponent && (
          <ActiveComponent {...(tabProps[activeTab] || {})} />
        )}
      </PageContent>
    </>
  )
}
