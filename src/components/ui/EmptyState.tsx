import { useThemeClasses } from '../../functions/themeStore';

interface EmptyStateProps {
  message: string;
  className?: string;
}

export default function EmptyState({ message, className = '' }: EmptyStateProps) {
  const { border, textMuted, bgSurface } = useThemeClasses();
  return (
    <div className={`flex items-center justify-center min-h-32 p-8 md:p-12 text-center ${textMuted} font-medium italic ${bgSurface} rounded-2xl border ${border} ${className}`}>
      {message}
    </div>
  );
}
