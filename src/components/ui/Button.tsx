import { type ReactNode, type ElementType } from 'react';
import { useThemeClasses } from '../../functions/themeStore';

interface ButtonProps {
  icon?: ElementType;
  label?: string;
  value?: ReactNode;
  onClick?: () => void;
  className?: string;
}

export function Button({ icon: Icon, label, value, onClick, className = '' }: ButtonProps) {
  const { bgSurface, bgSurfaceHover, border, textMuted, textMain } = useThemeClasses();

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2 h-10 rounded-full border transition-colors cursor-pointer ${bgSurface} ${border} ${bgSurfaceHover} ${className}`}
    >
      {Icon && <Icon size={16} className={textMuted} />}
      {label && <span className={`text-sm ${textMuted} hidden sm:inline`}>{label}</span>}
      {value && <span className={`text-sm font-medium ${textMain}`}>{value}</span>}
    </button>
  );
}
