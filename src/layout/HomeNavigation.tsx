import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../functions/supabase'
import PageHeader from './PageHeader'
import { groupLatestTournaments } from '../functions/tournaments'

export default function HomeNavigation({ activeTabId = 'matches', onChange }: { activeTabId?: string, onChange?: (id: string) => void }) {
  const navigate = useNavigate()
  const [tournaments, setTournaments] = useState<{ label: string, id: string }[]>([])

  useEffect(() => {
    async function fetchFeatured() {
      // 1. Traemos todos los torneos
      const { data } = await supabase
        .from('tournaments')
        .select('tournament_id, tournament_name')
      
      if (data) {
        const latestTournaments = groupLatestTournaments(data)
        
        setTournaments(latestTournaments.map(t => ({
          label: t.name,
          id: t.id
        })))
      }
    }
    fetchFeatured()
  }, [])

  const homeTabs = [
    { id: 'matches', label: 'Partidos' },
    { 
      id: 'tournaments', 
      label: 'Torneos',
      dropdownItems: tournaments.map(t => ({
        label: t.label,
        onClick: () => navigate(`/tournament/${t.id}`)
      }))
    },
    { id: 'teams', label: 'Equipos', disabled: true },
  ]

  return (
    <PageHeader
      tabs={homeTabs}
      activeTabId={activeTabId}
      onChange={onChange}
    />
  )
}
