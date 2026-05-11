import { Link } from 'react-router-dom';
import { Trophy } from 'lucide-react';
import UserMenu from '../components/header/UserMenu';
import { useThemeClasses } from '../functions/themeStore';
import { LAYOUT_CONFIG } from '../functions/layoutConfig';

export default function Header() {
  const { bgApp, border, textMain } = useThemeClasses();
  return (
    <header className={`fixed top-0 left-0 right-0 h-16 ${bgApp} bg-opacity-80 backdrop-blur-md border-b ${border} z-50 flex items-center`}>
      {/* Sección Izquierda - Alineada con SidebarLeft */}
      <div 
        className={`hidden xl:flex items-center shrink-0 px-6 border-r ${border} h-full`}
        style={{ width: LAYOUT_CONFIG.sidebarWidth }}
      >
        <Link to="/" className="flex items-center gap-2 group">
          <div className={`w-8 h-8 rounded-lg bg-current flex items-center justify-center`}>
            <Trophy size={18} className={bgApp.replace('bg-', 'text-')} />
          </div>
          <span className={`font-black text-lg tracking-tighter ${textMain}`}>
            RESULTADOS<span className="opacity-50">.AR</span>
          </span>
        </Link>
      </div>

      {/* Sección Central - Alineada con el contenido Main */}
      <div className="flex-1 flex items-center justify-between px-6 h-full">
        <div className="flex items-center gap-4">
          {/* Los selectores se movieron al UserMenu */}
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
