import { useEffect, useState } from 'react';
import { useTheme, useThemeClasses } from '../../functions/themeStore';
import { Button } from '../ui/Button';
import { Eye, EyeOff, MousePointer, MousePointerBan } from 'lucide-react';

const STORAGE_KEY = 'admin-unrestricted';

export default function ControlPanel() {
  const { showApiIds, setShowApiIds } = useTheme();
  const { textMuted } = useThemeClasses();

  const [unrestricted, setUnrestricted] = useState(
    () => localStorage.getItem(STORAGE_KEY) === 'true'
  );

  useEffect(() => {
    if (unrestricted) {
      document.body.classList.add('admin-unrestricted');
    } else {
      document.body.classList.remove('admin-unrestricted');
    }
    localStorage.setItem(STORAGE_KEY, String(unrestricted));
  }, [unrestricted]);

  return (
    <div className="flex items-center justify-start gap-4 w-full">
      <span className={`text-xs ${textMuted} italic`}>
        * Ajustes locales
      </span>
      <Button
        icon={showApiIds ? Eye : EyeOff}
        label={showApiIds ? "Mostrando IDs de API" : "Ocultando IDs de API"}
        onClick={() => setShowApiIds(!showApiIds)}
      />
      <Button
        icon={unrestricted ? MousePointer : MousePointerBan}
        label={unrestricted ? "Selección habilitada" : "Selección deshabilitada"}
        onClick={() => setUnrestricted(prev => !prev)}
      />
    </div>
  );
}