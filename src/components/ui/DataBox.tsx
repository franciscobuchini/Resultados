import type { ReactNode } from 'react';
import { useThemeClasses } from '../../functions/themeStore';

interface DataBoxProps {
  /** Contenido del contenedor, usualmente múltiples DataRow */
  children: ReactNode;
  /** Título opcional de la sección (ej: "Grupo A", "Partidos", etc) */
  title?: ReactNode;
  /** Clases adicionales para el wrapper externo */
  className?: string;
}

/**
 * DataBox - El contenedor universal ("las paredes") de la aplicación.
 * Encapsula un conjunto de DataRows con un estilo visual coherente,
 * bordes redondeados, sombras y manejo de títulos.
 */
export default function DataBox({
  children,
  className = ""
}: DataBoxProps) {
  const { border } = useThemeClasses();

  return (
    <div className={`flex flex-col ${className}`}>
      {/* 
        El contenedor principal. 
        Utilizamos [&>*:last-child]:border-b-0 para asegurar que el último 
        DataRow no tenga borde inferior, manteniendo la limpieza visual.
      */}
      <div className={`border-x border-b sm:border-t ${border} rounded-b-3xl sm:rounded-t-3xl overflow-hidden [&>*:last-child]:border-b-0`}>
        {children}
      </div>
    </div>
  );
}
