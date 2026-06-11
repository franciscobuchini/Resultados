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
import { resolveTabModules } from '../tabTypes'
import { decryptPayload } from '../../functions/crypto'
import { getMatchStatusLabel } from '../../functions/matchHelpers'

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

      // Cargar mapeo de equipos (team_id_api_drsm → team_id local)
      const { data: teamsData } = await supabase
        .from('teams')
        .select('team_id, team_id_api_drsm')
        .not('team_id_api_drsm', 'is', null)

      const teamMapApiToLocal = new Map<number, string>()
      if (teamsData) {
        teamsData.forEach(t => {
          if (t.team_id_api_drsm) {
            teamMapApiToLocal.set(Number(t.team_id_api_drsm), t.team_id)
          }
        })
      }


      let fetchedMatches: Match[] = []
      let page = 0
      const pageSize = 1000

      while (true) {
        const { data: chunk, error } = await supabase
          .from('matches')
          .select('*')
          .eq('tournament_id', tournamentId)
          .order('match_date', { ascending: true })
          .order('match_time_utc', { ascending: true })
          .range(page * pageSize, (page + 1) * pageSize - 1)

        if (error || !chunk || chunk.length === 0) break
        fetchedMatches = fetchedMatches.concat(chunk as Match[])
        if (chunk.length < pageSize) break
        page++
      }

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
      
      setMatches(fetchedMatches)

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

      // ===== FETCH DE DATOS EN VIVO: PRIMERO FECHAS CERCANAS (AWAIT), LUEGO RESTO EN BACKGROUND =====
      ;(async () => {
        try {

          const uniqueDates = Array.from(new Set(fetchedMatches.map(m => m.match_date).filter(Boolean))) as string[]


          // Helper para fetchear y actualizar una fecha
          const fetchAndUpdateDate = async (date: string) => {
            try {
              const res = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-fixtures?date=${date}&encrypt=true`,
                {
                  headers: {
                    'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                  }
                }
              )

              if (!res.ok) return

              const rawText = await res.text()
              const data = decryptPayload(rawText)
              const fixtures = Array.isArray(data) ? data : (data?.data && Array.isArray(data.data) ? data.data : [])

              if (fixtures.length === 0) return



              // Mapear fixtures por (date, homeId_local, awayId_local)
              const fixturesByTeams = new Map<string, any>()
              fixtures.forEach((f: any) => {
                const homeIdLocal = teamMapApiToLocal.get(f.home_team_id)?.toString() || f.home_team_id.toString()
                const awayIdLocal = teamMapApiToLocal.get(f.away_team_id)?.toString() || f.away_team_id.toString()
                const key = `${date}|${homeIdLocal}|${awayIdLocal}`
                fixturesByTeams.set(key, f)
              })

              // Actualizar matches
              setMatches(prevMatches => {
                let updatedCount = 0
                const updated = prevMatches.map(m => {
                  if (m.match_date !== date) return m

                  const key = `${date}|${m.home_id}|${m.away_id}`
                  const fixture = fixturesByTeams.get(key)

                  if (fixture) {
                    updatedCount++
                    return {
                      ...m,
                      home_score: fixture.home_score ?? m.home_score,
                      away_score: fixture.away_score ?? m.away_score,
                      match_status: fixture.status ?? m.match_status,
                      match_status_label: getMatchStatusLabel(fixture.status ?? m.match_status, m.match_date, fixture.current_minute)
                    }
                  }
                  return m
                })
                if (updatedCount > 0) {

                }
                return updated
              })
            } catch (err) {

            }
          }

          // PRIMERO: Cargar fechas cercanas (hoy, mañana, pasado mañana) CON AWAIT
          const today = new Date().toISOString().split('T')[0]
          const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]
          const dayAfter = new Date(Date.now() + 172800000).toISOString().split('T')[0]
          const nearDates = [today, tomorrow, dayAfter].filter(d => uniqueDates.includes(d))

          for (const date of nearDates) {
            await fetchAndUpdateDate(date)
          }

          // LUEGO: Cargar el resto en background (sin await)
          const remainingDates = uniqueDates.filter(d => !nearDates.includes(d))
          for (const date of remainingDates) {
            fetchAndUpdateDate(date).catch(() => {})
          }


        } catch (err) {

        }
      })()
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

      <PageContent maxWidth="1600">
        {ActiveComponent && (
          <ActiveComponent {...(tabProps[activeTab] || {})} />
        )}
      </PageContent>
    </>
  )
}
