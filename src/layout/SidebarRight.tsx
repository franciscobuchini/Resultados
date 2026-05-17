import { useThemeClasses } from '../functions/themeStore';
import { LAYOUT_CONFIG } from '../functions/layoutConfig';
import Scrollbar from './Scrollbar';

export default function SidebarRight() {
  const { border } = useThemeClasses();

  return (
    <div className={`hidden 2xl:block shrink-0 border-l ${border}`} style={{ width: LAYOUT_CONFIG.sidebarWidth }}>
      <Scrollbar className="p-6 space-y-8 sticky top-16 max-h-[calc(100vh-64px)]">
      </Scrollbar>
    </div>
  );
}
