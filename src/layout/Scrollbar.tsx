import React from 'react';
import { useTheme, useThemeClasses } from '../functions/themeStore';

interface ScrollbarProps {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Scrollbar - Componente Wrapper para áreas con scroll.
 * Sincronizado con el themeStore para ofrecer una experiencia visual coherente.
 */
export default function Scrollbar({ children, className = '', style = {} }: ScrollbarProps) {
  const { currentTheme } = useTheme();
  const { textMain } = useThemeClasses();

  // Detectamos si es un tema light o dark para ajustar las opacidades base
  const isDark = !currentTheme.endsWith('-light');
  
  // Colores base para el thumb según el tipo de tema
  const thumbBase = isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)';
  const thumbHover = isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.3)';

  // Si no hay children Y no hay clases/estilos de contenedor, actúa como inyector global
  const isGlobalInjector = !children && className === '' && Object.keys(style).length === 0;

  if (isGlobalInjector) {
    return (
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { 
          background: ${thumbBase};
          border-radius: 10px; 
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { 
          background: ${thumbHover}; 
        }
      `}} />
    );
  }

  return (
    <div 
      className={`overflow-y-auto custom-scrollbar ${className} ${textMain}`}
      style={{
        scrollbarWidth: 'thin',
        scrollbarColor: `${thumbBase} transparent`,
        ...style
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { 
          background: ${thumbBase};
          border-radius: 10px; 
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { 
          background: ${thumbHover}; 
        }
      `}} />
      {children}
    </div>
  );
}
