import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '../functions/supabase';
import { useThemeClasses } from '../functions/themeStore';
import { Accordion } from '../components/ui/Accordion';

interface TournamentItem {
  tournament_id: string;
  tournament_name: string;
  tournament_crest_url: string | null;
  tournament_season: string | null;
  tournament_country_id: string | null;
}

interface Country {
  country_id: string;
  country_name: string;
  country_flag_url: string | null;
}

export default function SidebarLeft() {
  const [tournaments, setTournaments] = useState<TournamentItem[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const { border, textMain, textMuted, bgSurface } = useThemeClasses();

  useEffect(() => {
    const fetchData = async () => {
      const [tRes, cRes] = await Promise.all([
        supabase
          .from('tournaments')
          .select('tournament_id, tournament_name, tournament_crest_url, tournament_season, tournament_country_id')
          .order('tournament_season', { ascending: false }),
        supabase
          .from('countries')
          .select('country_id, country_name, country_flag_url')
      ]);

      if (tRes.data) setTournaments(tRes.data as TournamentItem[]);
      if (cRes.data) setCountries(cRes.data as Country[]);
      setLoading(false);
    };
    fetchData();
  }, []);

  const grouped = tournaments.reduce((acc, t) => {
    const cid = t.tournament_country_id || 'INT';
    if (!acc[cid]) acc[cid] = [];
    acc[cid].push(t);
    return acc;
  }, {} as Record<string, TournamentItem[]>);

  const sortedCountryIds = Object.keys(grouped).sort((a, b) => {
    if (a === 'INT') return 1;
    if (b === 'INT') return -1;
    const nameA = countries.find(c => c.country_id === a)?.country_name || a;
    const nameB = countries.find(c => c.country_id === b)?.country_name || b;
    return nameA.localeCompare(nameB);
  });

  return (
    <aside className={`hidden xl:block w-[18%] shrink-0 border-r ${border} p-6 sticky top-16 h-[calc(100vh-64px)] overflow-y-auto custom-scrollbar`}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          {loading ? (
            <div className="flex flex-col gap-2">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className={`h-10 rounded-xl ${bgSurface} animate-pulse`} />
              ))}
            </div>
          ) : (
            sortedCountryIds.map(cid => (
              <Accordion 
                key={cid}
                cid={cid}
                country={countries.find(c => c.country_id === cid)}
                tournaments={grouped[cid]}
              />
            ))
          )}
        </div>

      </div>
    </aside>
  );
}
