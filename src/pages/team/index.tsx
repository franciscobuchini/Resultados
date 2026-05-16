import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../../functions/supabase'
import PageBanner from '../../layout/PageBanner'
import PageContent from '../../layout/PageContent'
import Error404 from '../Error404'
import type { Goal } from '../../../shared/tournament/matchTypes'
import LoadingState from '../../components/ui/LoadingState'
import PageHeader from '../../layout/PageHeader'
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
  const { teamId } = useParams<{ teamId: string }>()
  const [loading, setLoading] = useState(true)
  const [team, setTeam] = useState<Team | null>(null)
  const [matches, setMatches] = useState<MatchWithTournament[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [teamLookup, setTeamLookup] = useState<TeamLookup>({})

  // Tab activa — por defecto la primera descubierta
  const [activeTab, setActiveTab] = useState(tabModules[0]?.tabConfig.id ?? 'matches')

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
      } catch (error) {
        console.error('Error fetching team data:', error)
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
          onChange={setActiveTab}
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
