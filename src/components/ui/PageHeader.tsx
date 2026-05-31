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
  iconColor = 'text-blue-500',
  className = ''
}: PageHeaderProps) {
  const { textMain } = useThemeClasses();

  return (
    <div className={`flex items-center gap-3 pb-4 ${className}`}>
      {Icon && <Icon size={24} className={iconColor} />}
      <h1 className={`text-2xl font-semibold ${textMain}`}>
        {title}
      </h1>
    </div>
  );
}
