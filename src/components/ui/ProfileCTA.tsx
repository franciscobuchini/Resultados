import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldQuestion, X, ChevronRight } from 'lucide-react';
import { useAuth } from '../../functions/auth';
import { useThemeClasses } from '../../functions/themeStore';
import { supabase } from '../../functions/supabase';

export default function ProfileCTA() {
  const { user } = useAuth();
  const { border, textMain, textMuted, bgSurface } = useThemeClasses();
  const [needsProfile, setNeedsProfile] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setNeedsProfile(false);
      setLoading(false);
      return;
    }

    // Check if already dismissed this session
    const dismissedKey = `profile-cta-dismissed-${user.id}`;
    if (sessionStorage.getItem(dismissedKey)) {
      setDismissed(true);
      setLoading(false);
      return;
    }

    const checkProfile = async () => {
      const { data } = await supabase
        .from('users')
        .select('user_team_id, user_country_id')
        .eq('id', user.id)
        .single();

      if (data && (!data.user_team_id || !data.user_country_id)) {
        setNeedsProfile(true);
      }
      setLoading(false);
    };

    checkProfile();
  }, [user]);

  const handleDismiss = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDismissed(true);
    if (user) {
      sessionStorage.setItem(`profile-cta-dismissed-${user.id}`, 'true');
    }
  };

  if (loading || !needsProfile || dismissed || !user) return null;

  return (
    <Link
      to="/profile"
      className={`group mx-4 sm:mx-6 mt-4 sm:mt-6 block rounded-2xl border ${border} ${bgSurface} overflow-hidden transition-all hover:scale-[1.005] active:scale-[0.995]`}
    >
      <div className="flex items-center gap-4 px-5 py-4 relative">
        {/* Icon */}
        <div className="shrink-0 w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center">
          <ShieldQuestion size={20} className="text-amber-400" />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold ${textMain}`}>
            ¡Contanos de qué equipo sos hincha! ⚽
          </p>
          <p className={`text-xs ${textMuted} mt-0.5`}>
            Completá tu perfil eligiendo tu club y tu país
          </p>
        </div>

        {/* Arrow */}
        <ChevronRight
          size={16}
          className={`${textMuted} shrink-0 transition-transform group-hover:translate-x-0.5`}
        />

        {/* Dismiss button */}
        <button
          onClick={handleDismiss}
          className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center ${textMuted} hover:${textMain} transition-colors hover:bg-white/5`}
          aria-label="Cerrar"
        >
          <X size={14} />
        </button>
      </div>
    </Link>
  );
}
