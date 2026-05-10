import React from 'react';
import { useThemeClasses } from '../functions/themeStore';

interface ScrollbarProps {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Scrollbar - Componente Wrapper para áreas con scroll.
 * Permite manejar estilos de scrollbar de forma más "React-way".
 */
export default function Scrollbar({ children, className = '', style = {} }: ScrollbarProps) {
  useThemeClasses();

  // Si no hay children Y no hay clases/estilos de contenedor, actúa como inyector global
  const isGlobalInjector = !children && className === '' && Object.keys(style).length === 0;

  if (isGlobalInjector) {
    return (
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { 
          background: color-mix(in srgb, currentColor, transparent 80%);
          border-radius: 10px; 
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { 
          background: color-mix(in srgb, currentColor, transparent 60%); 
        }
      `}} />
    );
  }

  return (
    <div 
      className={`overflow-y-auto custom-scrollbar ${className}`}
      style={{
        scrollbarWidth: 'thin',
        scrollbarColor: 'var(--color-zinc-700) transparent',
        ...style
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { 
          background: color-mix(in srgb, currentColor, transparent 80%);
          border-radius: 10px; 
        }
      `}} />
      {children}
    </div>
  );
}
