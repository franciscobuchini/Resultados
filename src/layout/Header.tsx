import { useThemeClasses } from '../functions/themeStore';
import { LAYOUT_CONFIG } from '../functions/layoutConfig';
import UserMenu from '../components/header/UserMenu';

export default function Header() {
  const { bgApp, border, logo } = useThemeClasses();

  return (
    <header className={`fixed top-0 left-0 right-0 h-16 ${bgApp} bg-opacity-80 backdrop-blur-md border-b ${border} z-50 flex items-center`}>
      {/* Sección Izquierda - Alineada con SidebarLeft */}
      <div
        className={`hidden 2xl:flex items-center shrink-0 px-6 border-r ${border} h-full`}
        style={{ width: LAYOUT_CONFIG.sidebarWidth }}
      >
        {/* Espacio para mantener alineación con el sidebar */}
      </div>

      {/* Sección Central - Logo + Navegación */}
      <div className="flex-1 flex items-center justify-between px-6 h-full">
        {/* Logo siempre en el centro (al inicio de la sección central) */}
        <a href="/" className="flex items-center shrink-0">
          <img src={logo} alt="Resultados Logo" className="w-9 h-9 object-contain" />
        </a>
        
        <div className="shrink-0">
          <UserMenu />
        </div>
      </div>

      {/* Sección Derecha - Alineada con SidebarRight */}
      <div
        className={`hidden 2xl:flex items-center shrink-0 px-6 border-l ${border} h-full`}
        style={{ width: LAYOUT_CONFIG.sidebarWidth }}
      >
        {/* Espacio para mantener alineación */}
      </div>
    </header>
  );
}
