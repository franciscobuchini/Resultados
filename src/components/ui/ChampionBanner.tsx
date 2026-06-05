import { Star } from 'lucide-react';
import { useThemeClasses } from '../../functions/themeStore';
import { Link } from 'react-router-dom';

interface ChampionBannerProps {
  teamId?: string;
  teamName: string;
  teamCrestUrl?: string | null;
}

export default function ChampionBanner({ teamId, teamName, teamCrestUrl }: ChampionBannerProps) {
  const { textAlert, border, bgSurface, textMain } = useThemeClasses();

  const content = (
    <div className="flex flex-col items-center gap-3">
      {/* Ornamental top line */}
      <div className="flex items-center gap-3 w-full max-w-md">
        <div className={`flex-1 h-px ${border} border-t`} />
        <Star size={14} className={`${textAlert} fill-current opacity-50`} />
        <div className={`flex-1 h-px ${border} border-t`} />
      </div>

      {/* Crest + Name side by side */}
      <div className="flex items-center gap-4">
        {teamCrestUrl ? (
          <img src={teamCrestUrl} alt={teamName} className="w-14 h-14 object-contain" />
        ) : (
          <div className={`w-14 h-14 ${bgSurface} rounded-full`} />
        )}
        <span className={`text-lg font-black uppercase tracking-widest ${textMain}`}>
          {teamName}
        </span>
      </div>

      {/* Ornamental bottom line */}
      <div className="flex items-center gap-3 w-full max-w-md">
        <div className={`flex-1 h-px ${border} border-t`} />
        <Star size={14} className={`${textAlert} fill-current opacity-50`} />
        <div className={`flex-1 h-px ${border} border-t`} />
      </div>
    </div>
  );

  return (
    <div className="relative px-6">
      {teamId ? (
        <Link to={`/team/${teamId}`} className="block hover:opacity-80 transition-opacity">
          {content}
        </Link>
      ) : (
        content
      )}
    </div>
  );
}
