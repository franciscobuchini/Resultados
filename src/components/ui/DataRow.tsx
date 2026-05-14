import type { ReactNode } from 'react';
import ImageCrest from './ImageCrest';
import { useThemeClasses } from '../../functions/themeStore';

// ============================================================
// CIMIENTOS — Constantes de diseño compartidas por todo el sistema
// ============================================================

/** Altura fija inamovible (pactada): 48px */
const HEIGHT = 'h-12';

/** Altura para filas de detalles: 24px */
const HEIGHT_DETAILS = 'min-h-6';

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
  noBorder?: boolean;
}

/**
 * StandingsRow — Fila completa de tabla de posiciones.
 * Estructura: [Posición] [Escudo + Nombre] [Estadísticas]
 */
export function StandingsRow({ position, logo, name, stats, className = '', noBorder = false }: StandingsRowProps) {
  const { bgApp, border, textMuted, textHover } = useThemeClasses();

  return (
    <div className={`${BASE} ${HEIGHT} ${bgApp} ${border} ${textMuted} ${textHover} ${noBorder ? '!border-b-0' : ''} ${className}`}>
      {/* Equipo */}
      <div className="flex-grow flex items-center gap-3 overflow-hidden min-w-0">
        <span className={`w-4 md:w-8 text-center shrink-0 ${textMuted} text-xs tabular-nums`}>
          {position}
        </span>
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
  const { bgSurface, border, textAccent } = useThemeClasses();

  return (
    <div className={`${BASE} ${HEIGHT} ${bgSurface} ${border} ${textAccent} font-medium uppercase ${className}`}>
      {/* Título */}
      <div className="flex-grow flex items-center overflow-hidden px-2">
        <span className="truncate">{title}</span>
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
  width = 'w-7 md:w-10',
  prominent = false,
  onClick,
  className = '',
}: {
  value: ReactNode;
  width?: string;
  prominent?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  const { textMuted, textProminent } = useThemeClasses();

  // Si la className contiene 'text-', asumimos que estamos pasando un color manual
  const hasCustomColor = className.includes('text-');

  // Si es prominent, aplicamos el estilo prominent (que incluye font-black)
  // pero si hay un color custom, intentamos que no choque (aunque textProminent trae color)
  // Lo ideal es que textProminent solo trajera peso, pero como trae color, lo manejamos así:
  const baseColor = prominent ? textProminent : textMuted;

  return (
    <div
      onClick={onClick}
      className={`${width} flex items-center justify-center ${!hasCustomColor ? baseColor : ''} ${prominent ? 'font-black' : ''} ${onClick ? 'cursor-pointer hover:opacity-70 select-none' : ''} ${className}`}
    >
      {value}
    </div>
  );
}

// ============================================================
// 3. FIXTURE — Fila de lista de partidos
// ============================================================

interface FixtureRowProps {
  /** ID del equipo local (para links) */
  homeId?: string;
  /** Escudo del equipo local */
  homeLogo?: string | null;
  /** Nombre del equipo local */
  homeName: string;
  /** Goles del equipo local */
  homeScore?: number | string | null;
  /** Goleadores del equipo local */
  homeScorers?: ReactNode;
  /** ID del equipo visitante (para links) */
  awayId?: string;
  /** Escudo del equipo visitante */
  awayLogo?: string | null;
  /** Nombre del equipo visitante */
  awayName: string;
  /** Goles del equipo visitante */
  awayScore?: number | string | null;
  /** Goleadores del equipo visitante */
  awayScorers?: ReactNode;
  /** Goles de penales del equipo local */
  homePenalty?: number | null;
  /** Goles de penales del equipo visitante */
  awayPenalty?: number | null;
  /** Hora del partido para mostrar cuando no hay marcador */
  matchTime?: string | null;
  /** Etiqueta de estado (ej: '34'', 'Final', 'LIVE') */
  statusLabel?: ReactNode;
  className?: string;
  noBorder?: boolean;
}

/**
 * FixtureRow — Fila completa de un partido.
 * Estructura: [Local ←] [Marcador] [→ Visitante] [Estado?]
 */
export function FixtureRow({
  homeId, homeLogo, homeName, homeScore, homeScorers,
  awayId, awayLogo, awayName, awayScore, awayScorers,
  homePenalty, awayPenalty,
  matchTime,
  statusLabel,
  className = '',
  noBorder = false
}: FixtureRowProps) {
  const { bgApp, border, textMain, textMuted, textProminent, bgSurfaceHover } = useThemeClasses();

  // Componente interno para evitar repetición
  const TeamLink = ({ id, name, logo, scorers, isRight }: { id?: string; name: string; logo?: string | null; scorers?: ReactNode; isRight?: boolean }) => {
    return (
      <div className={`flex-1 flex items-center gap-3 overflow-hidden min-w-0 ${isRight ? 'flex-row-reverse text-right justify-start' : 'justify-start'}`}>
        {/* Escudo - Única parte con link y cursor-pointer */}
        <div className="shrink-0 relative z-10">
          {id ? (
            <a href={`/team/${id}`} onClick={(e) => { e.stopPropagation(); }} className="cursor-pointer hover:opacity-70 transition-opacity flex items-center justify-center">
              <ImageCrest src={logo} />
            </a>
          ) : (
            <ImageCrest src={logo} />
          )}
        </div>

        {/* Nombre del equipo (Se oculta si hay scorers y estamos en hover sobre LA FILA) */}
        <span className={`truncate ${scorers ? 'group-hover:hidden' : ''}`}>{name}</span>

        {/* Goleadores que aparecen al hacer hover sobre LA FILA */}
        {scorers && (
          <div className={`hidden group-hover:flex items-center flex-1 text-[11px] ${textMain} leading-tight italic tracking-wide animate-in fade-in duration-300 ${isRight ? 'justify-end' : 'justify-start'}`}>
            {scorers}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`group ${BASE} ${HEIGHT} ${bgApp} ${border} ${textMuted} ${noBorder ? '!border-b-0' : ''} ${className}`}>
      {/* Estado (Apartado extra a la izquierda para LIVE/FINAL) */}
      <div className="shrink-0 w-12 text-left text-[10px] font-bold uppercase tracking-tighter mr-2">
        {statusLabel}
      </div>

      {/* Contenido principal: Local + Marcador + Visitante */}
      <div className="flex-grow flex items-center overflow-hidden min-w-0">
        {/* Equipo Local */}
        <TeamLink id={homeId} name={homeName} logo={homeLogo} scorers={homeScorers} isRight />

        {/* Marcador */}
        <div className="flex-shrink-0 flex justify-center w-24 gap-2 tabular-nums">
          {/* Penalty Local (Espacio reservado) */}
          <div className="flex-1 flex justify-end">
            {(homePenalty !== undefined && homePenalty !== null) && (
              <span className={`${textMuted} font-normal`}>({homePenalty})</span>
            )}
          </div>

          {/* Goles u Horario */}
          <div className="flex gap-2 font-bold min-w-[32px] justify-center">
            {(homeScore === null || homeScore === undefined) && (awayScore === null || awayScore === undefined) && matchTime ? (
              <span className={`${textMuted} font-normal`}>{matchTime}</span>
            ) : (
              <>
                <span className={textProminent}>{homeScore ?? '-'}</span>
                <span className={`${textMuted} font-normal opacity-40`}>:</span>
                <span className={textProminent}>{awayScore ?? '-'}</span>
              </>
            )}
          </div>

          {/* Penalty Visita (Espacio reservado) */}
          <div className="flex-1 flex justify-start">
            {(awayPenalty !== undefined && awayPenalty !== null) && (
              <span className={`${textMuted} font-normal`}>({awayPenalty})</span>
            )}
          </div>
        </div>

        {/* Equipo Visitante */}
        <TeamLink id={awayId} name={awayName} logo={awayLogo} scorers={awayScorers} />
      </div>
    </div>
  );
}

/**
 * DetailsRow — Fila de detalles (goleadores, incidencias, etc.)
 * Estructura simplificada con altura reducida (h-6).
 */
export function DetailsRow({ children, className = '', noBorder = false }: { children: ReactNode; className?: string; noBorder?: boolean }) {
  const { bgApp, border, textMuted } = useThemeClasses();

  return (
    <div className={`grid items-center w-full ${HEIGHT_DETAILS} ${bgApp} ${border} border-b text-xs leading-tight ${noBorder ? '!border-b-0' : ''} ${className}`}>
      <div className={`px-2 ${textMuted} overflow-hidden min-w-0`}>
        {children}
      </div>
    </div>
  );
}
