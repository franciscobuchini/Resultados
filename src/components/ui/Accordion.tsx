import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { useThemeClasses } from '../../functions/themeStore';

interface TournamentItem {
  tournament_id: string;
  tournament_name: string;
  tournament_season: string | null;
}

interface Country {
  country_id: string;
  country_name: string;
  country_flag_url: string | null;
}

interface AccordionProps {
  cid: string;
  country?: Country;
  tournaments: TournamentItem[];
  defaultOpen?: boolean;
}

export function Accordion({ cid, country, tournaments, defaultOpen = true }: AccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const { border, textMain, textMuted, bgSurface } = useThemeClasses();
  
  const countryName = country?.country_name || (cid === 'INT' ? 'Internacional' : cid);

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between w-full ${textMain} cursor-pointer group`}
      >
        <div className="flex items-center gap-2">
          {country?.country_flag_url && (
            <img 
              src={country.country_flag_url} 
              alt="" 
              className="w-6 h-auto object-contain" 
            />
          )}
          <span>{countryName}</span>
        </div>
        <ChevronDown 
          size={16} 
          className={`transition-transform duration-300 ${!isOpen ? '-rotate-90' : ''}`} 
        />
      </button>
      
      <div className={`grid transition-all duration-300 ease-in-out ${!isOpen ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr] opacity-100'}`}>
        <div className="overflow-hidden">
          <div className={`flex flex-col gap-1.5 mt-2 ml-2 pl-4 border-l ${border}`}>
            {tournaments.map(t => (
              <Link
                key={t.tournament_id}
                to={`/tournament/${t.tournament_id}`}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all group ${
                  tournamentId === t.tournament_id 
                    ? `${bgSurface} border ${border} shadow-sm` 
                    : `hover:${bgSurface}/50`
                }`}
              >
                <span className={`text-sm truncate ${
                  tournamentId === t.tournament_id ? textMain : `${textMuted} group-hover:${textMain}`
                }`}>
                  {t.tournament_name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
