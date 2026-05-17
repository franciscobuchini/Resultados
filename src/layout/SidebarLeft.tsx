import { useThemeClasses } from '../functions/themeStore';
import { LAYOUT_CONFIG } from '../functions/layoutConfig';
import Scrollbar from './Scrollbar';

export default function SidebarLeft() {
  const { border } = useThemeClasses();

  return (
    <div className={`hidden 2xl:block shrink-0 border-r ${border}`} style={{ width: LAYOUT_CONFIG.sidebarWidth }}>
      <Scrollbar className="p-6 sticky top-16 max-h-[calc(100vh-64px)]">
        {/* Contenedor vacío para mantener la estructura visual */}
        <div className="flex flex-col gap-6" />
      </Scrollbar>
    </div>
  );
}
