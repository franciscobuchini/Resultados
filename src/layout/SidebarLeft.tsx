import { useThemeClasses } from '../functions/themeStore';
import { LAYOUT_CONFIG } from '../functions/layoutConfig';
import Scrollbar from './Scrollbar';

export default function SidebarLeft() {
  const { border } = useThemeClasses();

  return (
    <Scrollbar 
      className={`hidden xl:block shrink-0 border-r ${border} p-6 sticky top-16 h-[calc(100vh-64px)]`}
      style={{ width: LAYOUT_CONFIG.sidebarWidth }}
    >
      {/* Contenedor vacío para mantener la estructura visual */}
      <div className="flex flex-col gap-6" />
    </Scrollbar>
  );
}
