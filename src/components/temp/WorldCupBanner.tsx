import { Link } from 'react-router-dom';
import {  Calendar } from 'lucide-react';
import { useThemeClasses } from '../../functions/themeStore';
import LogoBanner from '../ui/LogoBanner';
import { useEffect, useState } from 'react';
import { supabase } from '../../functions/supabase';

const HOST_TEAMS = [
  { id: 'INT200', name: 'Estados Unidos' },
  { id: 'INT124', name: 'México' },
  { id: 'INT037', name: 'Canadá' },
];

interface TeamCrest {
  team_id: string;
  team_crest_url: string | null;
}

export default function WorldCupBanner() {
  const { border, textMain, textMuted, bgSurface } = useThemeClasses();
  const [crests, setCrests] = useState<Record<string, string | null>>({});

  const bannerImg = "https://sportsworld.co.uk/wp-content/smush-webp/2025/03/world-cup-2026-servies-background.jpg.webp";
  const logoImg = "https://res.cloudinary.com/djfdvub9d/image/upload/q_auto/f_auto/v1779923897/wc2026_l9feuk.webp";

  useEffect(() => {
    const ids = HOST_TEAMS.map(t => t.id);
    supabase
      .from('teams')
      .select('team_id, team_crest_url')
      .in('team_id', ids)
      .then(({ data }) => {
        if (!data) return;
        const map: Record<string, string | null> = {};
        (data as TeamCrest[]).forEach(t => { map[t.team_id] = t.team_crest_url; });
        setCrests(map);
      });
  }, []);

  return (
    <Link
      to="/tournament/INT.2026.WC"
      className={`group -mt-8 sm:mt-0 block relative sm:rounded-2xl rounded-none sm:border ${border} ${bgSurface} overflow-hidden`}
    >
      {/* Background Image with Mask fading to bgSurface */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img
          src={bannerImg}
          alt="Mundial 2026 Banner"
          className="w-full h-full object-cover wc-banner-mask"
        />
      </div>

      {/* Content Container (Larger padding for height) */}
      <div className="relative z-20 flex flex-col md:flex-row md:items-center justify-between gap-6 px-5 py-6 sm:px-8 sm:py-8 md:py-12">

        {/* Left Side: Logo & Info */}
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 w-full text-center sm:text-left">
          {/* Logo Container (Larger size) */}
          <LogoBanner src={logoImg} alt="Mundial 2026 Logo" size="lg" />

          {/* Text Details */}
          <div className="flex-1 min-w-0 flex flex-col items-center sm:items-start">
            <h3 className={`text-2xl sm:text-3xl font-black tracking-tight leading-none uppercase ${textMain} flex items-center gap-2`}>
              FIFA WORLD CUP 2026
            </h3>

            {/* Host Countries */}
            <div className="flex items-center justify-center sm:justify-start gap-3 mt-2.5 flex-wrap">
              {HOST_TEAMS.map((team, idx) => (
                <div key={team.id} className="flex items-center gap-1.5">
                  {crests[team.id] ? (
                    <img
                      src={crests[team.id]!}
                      alt={team.name}
                      className="w-5 h-5 object-contain shrink-0"
                    />
                  ) : null}
                  <span className={`text-xs sm:text-sm font-medium ${textMain}`}>{team.name}</span>
                  {idx < HOST_TEAMS.length - 1 && (
                    <span className={`${textMuted} text-xs`}>·</span>
                  )}
                </div>
              ))}
            </div>

            {/* Dates */}
            <div className={`flex items-center gap-1.5 mt-2 ${textMuted}`}>
              <Calendar size={13} className="shrink-0" />
              <span className="text-xs sm:text-sm font-medium">11 de Junio – 19 de Julio, 2026</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
