import { useThemeClasses } from '../functions/themeStore';

export default function SidebarRight() {
  const { border } = useThemeClasses();
  return (
    <aside className={`hidden lg:block w-[18%] shrink-0 border-l ${border} p-6 space-y-8 sticky top-16 h-[calc(100vh-64px)] overflow-y-auto custom-scrollbar`}>
    </aside>
  );
}
