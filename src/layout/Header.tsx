import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import UserMenu from '../components/header/UserMenu';
import { useTheme, useThemeClasses } from '../functions/themeStore';
import { LAYOUT_CONFIG } from '../functions/layoutConfig';

import { Button } from '../components/ui/Button';

export default function Header() {
  const { bgApp, border, logo } = useThemeClasses();
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/';

  const { lastTournamentId } = useTheme();

  const handleBack = () => {
    // Si tenemos un último torneo guardado
    if (lastTournamentId) {
      // Si ya estamos en la página de ese torneo, vamos al home
      if (location.pathname === `/tournament/${lastTournamentId}`) {
        navigate('/');
      } else {
        // Si estamos en un equipo o perfil, volvemos al torneo
        navigate(`/tournament/${lastTournamentId}`);
      }
    } else {
      // Si no hay historial de torneos, siempre al home
      navigate('/');
    }
  };

  return (
    <header className={`fixed top-0 left-0 right-0 h-16 ${bgApp} bg-opacity-80 backdrop-blur-md border-b ${border} z-50 flex items-center`}>
      {/* Sección Izquierda - Alineada con SidebarLeft */}
      <div
        className={`hidden xl:flex items-center shrink-0 px-6 border-r ${border} h-full`}
        style={{ width: LAYOUT_CONFIG.sidebarWidth }}
      >
        <a href="/" className="flex items-center gap-2 group">
          <img src={logo} alt="Resultados Logo" className="w-8 h-8 object-contain" />
        </a>
      </div>

      {/* Sección Central - Alineada con el contenido Main */}
      <div className="flex-1 flex items-center justify-between px-6 h-full">
        <div className="flex items-center gap-4">
          {!isHome && (
            <Button
              icon={ChevronLeft}
              label="Volver"
              onClick={handleBack}
            />
          )}
          <a href="/" className="xl:hidden flex items-center gap-2">
            <img src={logo} alt="Resultados Logo" className="w-8 h-8 object-contain" />
          </a>
        </div>
        <UserMenu />
      </div>

      {/* Sección Derecha - Alineada con SidebarRight */}
      <div
        className={`hidden lg:flex items-center shrink-0 px-6 border-l ${border} h-full`}
        style={{ width: LAYOUT_CONFIG.sidebarWidth }}
      >
        {/* Espacio para mantener alineación */}
      </div>
    </header>
  );
}
