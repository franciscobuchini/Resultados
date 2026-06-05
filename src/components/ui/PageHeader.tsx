import type { ElementType } from 'react';
import { useThemeClasses } from '../../functions/themeStore';

interface PageHeaderProps {
  icon?: ElementType;
  title: string;
  iconColor?: string;
  className?: string;
}

export function PageHeader({ 
  icon: Icon, 
  title, 
  iconColor,
  className = ''
}: PageHeaderProps) {
  const { textMain, textInfo } = useThemeClasses();
  const resolvedIconColor = iconColor || textInfo || 'text-blue-500';

  return (
    <div className={`flex items-center gap-3 pb-4 ${className}`}>
      {Icon && <Icon size={24} className={resolvedIconColor} />}
      <h1 className={`text-2xl font-semibold ${textMain}`}>
        {title}
      </h1>
    </div>
  );
}
