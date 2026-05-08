import { useThemeClasses } from '../functions/themeStore';

export default function SidebarLeft() {
  const { border } = useThemeClasses();

  return (
    <aside className={`hidden xl:block w-[18%] shrink-0 border-r ${border} p-6 sticky top-16 h-[calc(100vh-64px)] overflow-y-auto custom-scrollbar`}>
    </aside>
  );
}
