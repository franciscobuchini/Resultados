import { useEffect, useState } from 'react'
import { supabase } from '../functions/supabase'

export interface Tournament {
  tournament_id: string;
  tournament_name: string;
  tournament_season?: string[];
}

interface Props {
  selectedTournament: string;
  onSelect: (id: string) => void;
}

export default function TournamentSelector({ selectedTournament, onSelect }: Props) {
  const [tournaments, setTournaments] = useState<Tournament[]>([])

  useEffect(() => {
    const fetchTournaments = async () => {
      const { data } = await supabase
        .from('tournaments')
        .select('tournament_id, tournament_name, tournament_season')
        .order('tournament_id')
      
      if (data) setTournaments(data)
    }
    fetchTournaments()
  }, [])

  return (
    <div className="max-w-4xl mx-auto px-4 mt-12 mb-4 flex justify-center">
      <div className="w-full max-w-sm">
        <select 
          className="w-full bg-zinc-900 border border-zinc-700 text-zinc-100 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none font-mono"
          value={selectedTournament}
          onChange={(e) => onSelect(e.target.value)}
        >
        <option value="">-- Seleccionar Torneo --</option>
        {tournaments.map(t => (
          <option key={t.tournament_id} value={t.tournament_id}>
            {t.tournament_name} {t.tournament_season ? `(${t.tournament_season.join('-')})` : ''}
          </option>
        ))}
        </select>
      </div>
    </div>
  )
}
