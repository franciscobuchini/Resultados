import { Link } from 'react-router-dom';
import UtcSelector from '../components/header/UtcSelector';
import SyncStatus from '../components/header/SyncStatus';
import ThemeSelector from '../components/header/ThemeSelector';
import { useThemeClasses } from '../functions/themeStore';

export default function Header() {
  const { bgApp, border, textMuted } = useThemeClasses();
  return (
    <header className={`fixed top-0 left-0 right-0 h-16 ${bgApp} bg-opacity-80 backdrop-blur-md border-b ${border} z-50 flex items-center px-6 justify-between`}>
      <div className={`hidden sm:flex items-center gap-4 border-r ${border} pr-6`}>
        <ThemeSelector />
        <UtcSelector />
        <SyncStatus />
      </div>
      <Link to="/admin" className={textMuted}>Admin</Link>
    </header>
  );
}
