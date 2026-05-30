import { useThemeClasses } from '../functions/themeStore';
import { LAYOUT_CONFIG } from '../functions/layoutConfig';

export default function SidebarRight() {
  const { border } = useThemeClasses();

  return (
    <div className={`hidden 2xl:block shrink-0 border-l ${border}`} style={{ width: LAYOUT_CONFIG.sidebarWidth }}>
      <div className="p-6 space-y-8">
      </div>
    </div>
  );
}
