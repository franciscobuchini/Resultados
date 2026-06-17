import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../functions/supabase'
import PageBanner from '../../layout/PageBanner'
import PageContent from '../../layout/PageContent'
import Error404 from '../Error404'
import type { Goal } from '../../functions/computeStandings'
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
  match_status_label?: string | null
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
// COMPONENTE
// ------------------------------------------------------------

export default function TeamPage() {
  const { teamId, tabId } = useParams<{ teamId: string; tabId?: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [team, setTeam] = useState<Team | null>(null)
  const [matches, setMatches] = useState<MatchWithTournament[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [teamLookup, setTeamLookup] = useState<TeamLookup>({})

  // Tab activa — leer de URL o usar la primera descubierta
  const activeTab = tabId && tabModules.some(m => m.tabConfig.id === tabId) 
    ? tabId 
    : tabModules[0]?.tabConfig.id ?? 'matches'

  // Función para cambiar pestaña navegando a la URL
  const handleTabChange = (newTabId: string) => {
    navigate(`/team/${teamId}/${newTabId}`)
  }

  // Construir array de tabs para PageHeader
  const headerTabs = tabModules.map(m => ({
    id: m.tabConfig.id,
    label: m.tabConfig.label,
    disabled: m.tabConfig.disabled,
  }))

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


        // 2. Traer todos los partidos vinculados al equipo (paginado)
        let fetchedMatches: MatchWithTournament[] = []
        let page = 0
        const pageSize = 1000

        while (true) {
          const { data: chunk, error } = await supabase
            .from('matches')
            .select('*')
            .or(`home_id.eq.${cleanId},away_id.eq.${cleanId}`)
            .order('match_date', { ascending: false })
            .range(page * pageSize, (page + 1) * pageSize - 1)

          if (error || !chunk || chunk.length === 0) break
          fetchedMatches = fetchedMatches.concat(chunk as MatchWithTournament[])
          if (chunk.length < pageSize) break
          page++
        }

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

        // 2.5 Traer goles
        const matchIds = fetchedMatches.map(m => m.match_id)
        if (matchIds.length > 0) {
          const { data: goalData } = await supabase
            .from('goals')
            .select('*')
            .in('match_id', matchIds)
            .order('goal_minute', { ascending: true })
          if (goalData) setGoals(goalData as Goal[])
        }

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
      } catch (error) {

      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [teamId])

  if (loading) return <LoadingState fullHeight />
  if (!team) return <Error404 />

  // ------------------------------------------------------------
  // PROPS PARA CADA TAB
  // ------------------------------------------------------------

  const tabProps: Record<string, any> = {
    matches: {
      teamId,
      matches,
      goals,
      teamLookup,
    },
    stats: {
      teamId,
      matches,
      goals,
      teamLookup,
    },
  }

  // Buscar el módulo activo
  const activeModule = tabModules.find(m => m.tabConfig.id === activeTab) ?? tabModules[0]
  const ActiveComponent = activeModule?.default

  return (
    <>
      <PageBanner
        title={team.team_fullname || team.team_name}
        tournament_banner_url={team.team_banner_url || null}
        logo={team.team_crest_url}
      >
        <PageHeader
          tabs={headerTabs}
          activeTabId={activeTab}
          onChange={handleTabChange}
        />
      </PageBanner>

      <PageContent maxWidth="1600" layout="grid-2">
        {ActiveComponent && (
          <ActiveComponent {...(tabProps[activeTab] || {})} />
        )}
      </PageContent>
    </>
  )
}
