import { useThemeClasses } from '../functions/themeStore';
import { useSidebarStore } from './SidebarLeft';
import { LAYOUT_CONFIG } from '../functions/layoutConfig';
import { Button } from '../components/ui/Button';
import UserMenu from '../components/header/UserMenu';
import { Menu, X } from 'lucide-react';

export default function Header() {
  const { bgApp, border, logo } = useThemeClasses();
  const LogoComponent = logo;
  const { isOpen, toggle } = useSidebarStore();

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
        {/* Logo */}
        <a href="/" className="flex items-center shrink-0">
          <LogoComponent className="w-9 h-9" />
        </a>
        
        <div className="flex items-center gap-2 shrink-0">
          <UserMenu />
          {/* Hamburger - solo visible en < 2xl */}
          <div className="2xl:hidden">
            <Button
              icon={isOpen ? X : Menu}
              variant="outline"
              size="md"
              onClick={toggle}
              title="Menú"
            />
          </div>
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
