import { type ElementType } from 'react';
import { useThemeClasses } from '../../functions/themeStore';

interface LabelProps {
  content: string;
  icon?: ElementType;
  className?: string;
}

export function Label({ content, icon: Icon, className = '' }: LabelProps) {
  const { textMuted } = useThemeClasses();

  return (
    <div className={`flex items-center gap-2 px-2 text-xs font-bold uppercase tracking-wider ${textMuted} ${className}`}>
      {Icon && <Icon size={14} className="shrink-0" />}
      <span>{content}</span>
    </div>
  );
}
