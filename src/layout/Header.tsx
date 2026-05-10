import UserMenu from '../components/header/UserMenu';
import { useThemeClasses } from '../functions/themeStore';
import { LAYOUT_CONFIG } from '../functions/layoutConfig';

export default function Header() {
  const { bgApp, border } = useThemeClasses();
  return (
    <header className={`fixed top-0 left-0 right-0 h-16 ${bgApp} bg-opacity-80 backdrop-blur-md border-b ${border} z-50 flex items-center`}>
      {/* Sección Izquierda - Alineada con SidebarLeft */}
      <div 
        className={`hidden xl:flex items-center shrink-0 px-6 border-r ${border} h-full`}
        style={{ width: LAYOUT_CONFIG.sidebarWidth }}
      >
        {/* Espacio para mantener alineación */}
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
