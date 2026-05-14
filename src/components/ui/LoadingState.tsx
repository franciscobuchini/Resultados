import React from 'react';
import { useThemeClasses } from '../../functions/themeStore';

interface LoadingStateProps {
  fullHeight?: boolean;
}

export default function LoadingState({ fullHeight = false }: LoadingStateProps) {
  const { border, textMain } = useThemeClasses();
  return (
    <div className={`flex items-center justify-center ${fullHeight ? 'min-h-[60vh]' : 'py-20'}`}>
      <div className={`w-10 h-10 border-4 ${border} border-t-current ${textMain} rounded-full animate-spin`} />
    </div>
  );
}
