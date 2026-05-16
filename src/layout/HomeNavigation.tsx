import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../functions/supabase'
import PageHeader from './PageHeader'

export default function HomeNavigation({ activeTabId = 'matches', onChange }: { activeTabId?: string, onChange?: (id: string) => void }) {
  const navigate = useNavigate()
  const [tournaments, setTournaments] = useState<{ label: string, id: string }[]>([])

  useEffect(() => {
    async function fetchFeatured() {
      // Traemos los torneos que queremos destacar (puedes ajustar los IDs)
      const { data } = await supabase
        .from('tournaments')
        .select('tournament_id, tournament_name')
        .in('tournament_id', ['ARG.2026.11', 'INT.2026.WC'])
      
      if (data) {
        setTournaments(data.map(t => ({
          label: t.tournament_name,
          id: t.tournament_id
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
