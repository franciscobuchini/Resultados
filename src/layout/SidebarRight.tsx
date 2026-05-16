import { useThemeClasses } from '../functions/themeStore';
import { LAYOUT_CONFIG } from '../functions/layoutConfig';
import Scrollbar from './Scrollbar';

export default function SidebarRight() {
  const { border } = useThemeClasses();
  return (
    <Scrollbar 
      className={`hidden 2xl:block shrink-0 border-l ${border} p-6 space-y-8 sticky top-16 h-[calc(100vh-64px)]`}
      style={{ width: LAYOUT_CONFIG.sidebarWidth }}
    >
    </Scrollbar>
  );
}
