import { useTheme, useThemeClasses } from '../../functions/themeStore';
import { Button } from '../ui/Button';
import { Eye, EyeOff } from 'lucide-react';

export default function ControlPanel() {
  const { showApiIds, setShowApiIds } = useTheme();
  const { textMuted } = useThemeClasses();

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
    </div>
  );
}
