import type { ReactNode } from 'react';

interface DataRowProps {
  /** Sección izquierda: usualmente para números de posición, mini escudos o iconos. */
  left?: ReactNode;
  /** Contenido principal: nombre del equipo, jugador, etc. Ocupa el espacio restante. */
  main: ReactNode;
  /** Sección derecha: para scores, puntos, fechas o tiempos. */
  right?: ReactNode;
  /** Evento opcional de click. */
  onClick?: () => void;
  /** Clases adicionales para personalización extrema. */
  className?: string;
  /** Define si actúa como cabecera (estilo más tenue y sin hover). */
  isHeader?: boolean;
}

/**
 * DataRow - El "ladrillo" fundamental del proyecto.
 * Altura única pactada: 56px (h-14).
 */
export default function DataRow({
  left,
  main,
  right,
  onClick,
  className = "",
  isHeader = false
}: DataRowProps) {
  
  // Altura fija inamovible (pactada)
  const HEIGHT = "h-14"; 

  const baseClasses = "flex items-center w-full px-4 border-b transition-all duration-200";
  
  const styleClasses = isHeader 
    ? "bg-zinc-900/80 border-zinc-800 text-zinc-500 text-[10px] font-black uppercase tracking-widest" 
    : "bg-zinc-950/20 border-zinc-900/50 hover:bg-white/[0.03] text-zinc-300 text-sm";
  
  const interactionClasses = (onClick && !isHeader) ? "cursor-pointer active:scale-[0.99]" : "cursor-default";

  return (
    <div 
      onClick={!isHeader ? onClick : undefined}
      className={`
        ${baseClasses} 
        ${HEIGHT} 
        ${styleClasses} 
        ${interactionClasses} 
        ${className}
      `}
    >
      {/* 1. SECCIÓN IZQUIERDA (Ancho mínimo para mantener alineación) */}
      {left && (
        <div className="flex-shrink-0 flex items-center justify-start min-w-[32px] mr-4">
          {left}
        </div>
      )}

      {/* 2. SECCIÓN PRINCIPAL (Flexible) */}
      <div className="flex-grow flex items-center overflow-hidden min-w-0">
        {main}
      </div>

      {/* 3. SECCIÓN DERECHA (Contenido al final) */}
      {right && (
        <div className="flex-shrink-0 flex items-center justify-end ml-4 gap-3">
          {right}
        </div>
      )}
    </div>
  );
}
