import type { ReactNode } from 'react';
import ImageCrest from './ImageCrest';
import { useThemeClasses } from '../../functions/themeStore';

// ============================================================
// CIMIENTOS — Constantes de diseño compartidas por todo el sistema
// ============================================================

/** Altura fija inamovible (pactada): 48px */
const HEIGHT = 'h-12';

/** Layout base de toda fila */
const BASE = 'flex items-center w-full px-3 border-b text-sm';

// Los estilos dependientes del tema ahora se asignan localmente en los componentes

// ============================================================
// 1. UNIVERSALES — Componentes que se usan en cualquier tabla
// ============================================================

/**
 * DataRowHeader — Cabecera de cualquier tabla.
 * Recibe children para máxima flexibilidad (flechas de navegación, títulos, etc.)
 */
export function DataRowHeader({ children, className = '' }: { children: ReactNode; className?: string }) {
  const { bgSurface, border, textAccent } = useThemeClasses();
  return (
    <div className={`${BASE} ${HEIGHT} ${bgSurface} ${border} ${textAccent} font-medium uppercase ${className}`}>
      <div className="flex-grow flex items-center overflow-hidden min-w-0">
        {children}
      </div>
    </div>
  );
}

/**
 * DataRowSeparator — Separador visual entre secciones (ej: "Jueves 29").
 */
export function DataRowSeparator({ label, className = '' }: { label: ReactNode; className?: string }) {
  const { bgApp, border, textAccent } = useThemeClasses();
  return (
    <div className={`${BASE} ${HEIGHT} ${bgApp} ${border} ${textAccent} font-medium uppercase ${className}`}>
      <div className="flex-grow flex items-center overflow-hidden min-w-0">
        {label}
      </div>
    </div>
  );
}

// ============================================================
// 2. STANDINGS — Fila de tabla de posiciones
// ============================================================

interface StandingsRowProps {
  /** Número de posición (1, 2, 3...) */
  position: number | string;
  /** URL del escudo del equipo */
  logo?: string | null;
  /** Nombre del equipo */
  name: string;
  /** Celdas de estadísticas (PTS, PJ, PG, etc.) */
  stats: ReactNode;
  className?: string;
}

/**
 * StandingsRow — Fila completa de tabla de posiciones.
 * Estructura: [Posición] [Escudo + Nombre] [Estadísticas]
 */
export function StandingsRow({ position, logo, name, stats, className = '' }: StandingsRowProps) {
  const { bgApp, border, textMuted, textHover } = useThemeClasses();
  
  return (
    <div className={`${BASE} ${HEIGHT} ${bgApp} ${border} ${textMuted} ${textHover} ${className}`}>
      {/* Posición */}
      <div className="flex-shrink-0 flex items-center justify-start min-w-[32px] mr-4">
        <span className={`w-8 text-center ${textMuted} text-xs tabular-nums`}>
          {position}
        </span>
      </div>

      {/* Equipo */}
      <div className="flex-grow flex items-center gap-3 overflow-hidden min-w-0">
        <ImageCrest src={logo} />
        <span className="truncate">{name}</span>
      </div>

      {/* Estadísticas */}
      <div className="flex-shrink-0 flex items-center justify-end">
        {stats}
      </div>
    </div>
  );
}

/**
 * StandingsHeaderRow — Cabecera específica de tabla de posiciones.
 * Estructura: [#] [Título] [Columnas de Stats]
 */
export function StandingsHeaderRow({ title, stats, className = '' }: { title: string; stats: ReactNode; className?: string }) {
  const { bgSurface, border, textAccent, textMuted } = useThemeClasses();

  return (
    <div className={`${BASE} ${HEIGHT} ${bgSurface} ${border} ${textAccent} font-medium uppercase ${className}`}>
      {/* # */}
      <div className="flex-shrink-0 flex items-center justify-start min-w-[32px] mr-4">
        <span className={`w-8 text-center ${textMuted} text-xs tabular-nums`}>
          #
        </span>
      </div>

      {/* Título */}
      <div className="flex-grow flex items-center overflow-hidden min-w-0">
        {title}
      </div>

      {/* Columnas */}
      <div className="flex-shrink-0 flex items-center justify-end">
        {stats}
      </div>
    </div>
  );
}

/**
 * StatGroup — Contenedor horizontal para celdas de estadísticas.
 */
export function StatGroup({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`flex items-center text-center text-xs ${className}`}>
      {children}
    </div>
  );
}

/**
 * Stat — Celda individual de estadística (PTS, PJ, PG, etc.)
 */
export function Stat({ 
  value, 
  width = 'w-10', 
  prominent = false,
  className = '',
}: { 
  value: ReactNode;
  width?: string;
  prominent?: boolean;
  className?: string;
}) {
  const { textMuted, textProminent } = useThemeClasses();
  const style = prominent ? textProminent : textMuted;
  return (
    <div className={`${width} flex items-center justify-center ${style} ${className}`}>
      {value}
    </div>
  );
}

// ============================================================
// 3. FIXTURE — Fila de lista de partidos
// ============================================================

interface FixtureRowProps {
  /** Escudo del equipo local */
  homeLogo?: string | null;
  /** Nombre del equipo local */
  homeName: string;
  /** Goles del equipo local */
  homeScore?: number | string | null;
  /** Escudo del equipo visitante */
  awayLogo?: string | null;
  /** Nombre del equipo visitante */
  awayName: string;
  /** Goles del equipo visitante */
  awayScore?: number | string | null;
  /** Estado o Hora del partido ("20:00", "FT", etc.) */
  status?: ReactNode;
  className?: string;
}

/**
 * FixtureRow — Fila completa de un partido.
 * Estructura: [Local ←] [Marcador] [→ Visitante] [Estado]
 */
export function FixtureRow({ 
  homeLogo, homeName, homeScore,
  awayLogo, awayName, awayScore,
  status,
  className = '',
}: FixtureRowProps) {
  const { bgApp, border, textMuted, textHover, textProminent } = useThemeClasses();
  
  return (
    <div className={`${BASE} ${HEIGHT} ${bgApp} ${border} ${textMuted} ${textHover} ${className}`}>
      {/* Contenido principal: Local + Marcador + Visitante */}
      <div className="flex-grow flex items-center overflow-hidden min-w-0">
        {/* Equipo Local (alineado a la derecha) */}
        <div className="flex-1 flex items-center gap-3 overflow-hidden flex-row-reverse text-right justify-start">
          <ImageCrest src={homeLogo} />
          <span className="truncate">{homeName}</span>
        </div>

        {/* Marcador */}
        <div className="flex items-center justify-center px-4 gap-2">
          <span className={textProminent}>{homeScore ?? '-'}</span>
          <span className={`${textMuted} font-normal`}>:</span>
          <span className={textProminent}>{awayScore ?? '-'}</span>
        </div>

        {/* Equipo Visitante (alineado a la izquierda) */}
        <div className="flex-1 flex items-center gap-3 overflow-hidden justify-start">
          <ImageCrest src={awayLogo} />
          <span className="truncate">{awayName}</span>
        </div>
      </div>

      {/* Estado / Hora */}
      {status && (
        <div className="flex-shrink-0 flex items-center justify-end">
          <div className="w-10 flex items-center justify-center text-xs">
            {status}
          </div>
        </div>
      )}
    </div>
  );
}
