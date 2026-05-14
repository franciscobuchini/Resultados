import React, { type ReactNode } from 'react';

interface PageContentProps {
  children: ReactNode;
  /** Ancho máximo del contenedor */
  maxWidth?: '3xl' | '4xl' | '1400' | '1600' | 'full';
  /** Distribución interna del contenedor */
  layout?: 'single' | 'grid-12' | 'grid-12-md' | 'grid-2';
}

export default function PageContent({ 
  children, 
  maxWidth = '3xl',
  layout = 'single'
}: PageContentProps) {
  const maxWidthClasses = {
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '1400': 'max-w-[1400px]',
    '1600': 'max-w-[1600px]',
    'full': 'max-w-full'
  };

  const layoutClasses = {
    'single': 'flex flex-col gap-6 md:gap-8',
    'grid-12': 'grid grid-cols-1 lg:grid-cols-12 gap-8',
    'grid-12-md': 'grid grid-cols-1 md:grid-cols-12 gap-8',
    'grid-2': 'grid grid-cols-1 lg:grid-cols-2 gap-8 items-start'
  };

  return (
    <div className={`${maxWidthClasses[maxWidth]} mx-auto p-2 md:p-8 ${layoutClasses[layout]}`}>
      {children}
    </div>
  );
}
