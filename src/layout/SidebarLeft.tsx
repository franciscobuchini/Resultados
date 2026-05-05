import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../functions/supabase';

interface TournamentItem {
  tournament_id: string;
  tournament_name: string;
}

export default function SidebarLeft() {
  const [tournaments, setTournaments] = useState<TournamentItem[]>([]);

  useEffect(() => {
    const fetchTournaments = async () => {
      const { data } = await supabase
        .from('tournaments')
        .select('tournament_id, tournament_name')
        .order('tournament_name');
      if (data) setTournaments(data);
    };
    fetchTournaments();
  }, []);

  return (
    <aside className="hidden xl:block w-[15%] shrink-0 border-r border-zinc-900 p-6 sticky top-16 h-[calc(100vh-64px)] overflow-y-auto custom-scrollbar">
      <div className="space-y-1">
        {tournaments.map(tourney => (
          <Link 
            key={tourney.tournament_id}
            to={`/tournament/${tourney.tournament_id}`}
            className="flex items-center gap-3 text-zinc-400 hover:text-white cursor-pointer transition-all p-2 rounded-xl hover:bg-zinc-900 group w-full"
          >
            <div className="w-2 h-2 rounded-full bg-zinc-800 group-hover:bg-white shadow-[0_0_8px_transparent] group-hover:shadow-white/20 transition-all"></div>
            <span className="text-xs font-medium tracking-tight">{tourney.tournament_name}</span>
          </Link>
        ))}
      </div>
    </aside>
  );
}
