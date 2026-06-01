import { useState, type ReactNode } from 'react';
import ImageCrest from './ImageCrest';
import { useTheme, useThemeClasses } from '../../functions/themeStore';
import { ChevronDown, Check, Ban } from 'lucide-react';
import MatchEventsTimeline from '../tables/MatchEventsTimeline';
import GoalAnimation from './GoalAnimation';

// ============================================================
// CIMIENTOS — Constantes de diseño compartidas por todo el sistema
// ============================================================

/** Altura fija inamovible (pactada): 48px */
export const HEIGHT = 'h-12';

/** Altura para filas de detalles: 24px */
const HEIGHT_DETAILS = 'min-h-6';

/** Layout base de toda fila */
export const BASE = 'flex items-center w-full px-3 border-b text-sm';

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
    <div className={`${BASE} ${HEIGHT} bg-transparent sm:${bgSurface} ${border} ${textAccent} font-medium uppercase ${className}`}>
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
  const { bgApp, bgSurface, border, textAccent } = useThemeClasses();
  return (
    <div className={`${BASE} ${HEIGHT} ${bgSurface} sm:${bgApp} ${border} ${textAccent} font-medium uppercase ${className}`}>
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
  const { bgApp, bgSurface, border, textMuted, textHover } = useThemeClasses();

  return (
    <div className={`${BASE} ${HEIGHT} ${bgSurface} sm:${bgApp} ${border} ${textMuted} ${textHover} ${noBorder ? '!border-b-0' : ''} ${className}`}>
      {/* Equipo */}
      <div className="flex-grow flex items-center gap-3 overflow-hidden min-w-0">
        <span className={`w-4 md:w-8 text-center shrink-0 ${textMuted} text-xs tabular-nums`}>
          {position}
        </span>
        <ImageCrest src={logo} />

        <span className="truncate leading-tight">
          {name}
        </span>
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
    <div className={`${BASE} ${HEIGHT} bg-transparent sm:${bgSurface} ${border} ${textAccent} font-medium uppercase ${className}`}>
      {/* Título */}
      <div className="flex-grow flex items-center gap-3 overflow-hidden min-w-0">
        <span className="w-4 md:w-8 shrink-0"></span> {/* Spacer para alinear con la posición */}
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
  title,
}: {
  value: ReactNode;
  width?: string;
  prominent?: boolean;
  onClick?: () => void;
  className?: string;
  title?: string;
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
      title={title}
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
  /** ID del partido */
  matchId?: string;
  /** Fecha del partido */
  matchDate?: string | null;
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
  matchNotes?: string | null;
  className?: string;
  noBorder?: boolean;
}

/**
 * FixtureRow — Fila completa de un partido.
 * Estructura: [Local ←] [Marcador] [→ Visitante] [Estado?]
 */
export function FixtureRow({
  matchId, matchDate,
  homeId, homeLogo, homeName, homeScore,
  awayId, awayLogo, awayName, awayScore,
  homePenalty, awayPenalty,
  homeIdDM, awayIdDM,
  matchTime,
  statusLabel,
  matchNotes,
  className = '',
  noBorder = false
}: FixtureRowProps & { homeIdDM?: string | number | null; awayIdDM?: string | number | null }) {
  const { bgApp, bgSurface, border, textMuted, textProminent, textError, textAlert } = useThemeClasses();
  const [isTimelineExpanded, setIsTimelineExpanded] = useState(false);

  // Componente interno para evitar repetición
  const TeamLink = ({ id, name, logo, idDM, isRight }: { id?: string; name: string; logo?: string | null; idDM?: string | number | null; isRight?: boolean }) => {
    const showApiIds = useTheme(state => state.showApiIds);
    const { textSuccess, textInfo } = useThemeClasses();
    const isMapped = id && isNaN(Number(id));

    const renderIdBadge = () => {
      if (!showApiIds) return null;
      if (isMapped) {
        return (
          <span className={`inline-flex items-center ${textSuccess} ${!isRight ? 'mr-1' : 'ml-1'}`}>
            <Check size={14} strokeWidth={3} />
          </span>
        );
      }
      if (idDM) {
        return (
          <span className={`font-mono ${textInfo} ${!isRight ? 'mr-1' : 'ml-1'}`}>
            ({idDM})
          </span>
        );
      }
      return null;
    };

    return (
      <div className={`w-full flex-1 flex items-center gap-1 sm:gap-3 overflow-hidden min-w-0 ${isRight ? 'flex-row-reverse text-right justify-start' : 'justify-start'}`}>
        {/* Escudo */}
        {logo && (
          <div className="shrink-0 relative z-10">
            {isMapped ? (
              <a href={`/team/${id}`} onClick={(e) => { e.stopPropagation(); }} className="cursor-pointer hover:opacity-70 transition-opacity flex items-center justify-center">
                <ImageCrest src={logo} />
              </a>
            ) : (
              <div className="flex items-center justify-center">
                <ImageCrest src={logo} />
              </div>
            )}
          </div>
        )}

        {/* Nombre del equipo + Badge/ID */}
        <span className="truncate text-xs sm:text-sm flex items-center">
          {!isRight && renderIdBadge()}
          <span className="truncate">{name}</span>
          {isRight && renderIdBadge()}
        </span>
      </div>
    );
  };

  const isLive = typeof statusLabel === 'string' && (statusLabel.includes("'") || ['LIVE', 'ET', 'MT', 'PEN', 'P'].includes(statusLabel));
  const isCancelled = statusLabel === 'C';
  const isFinished = statusLabel === '✓';

  return (
    <div className={`relative flex flex-col w-full ${bgSurface} sm:${bgApp} ${border} ${noBorder ? '' : 'border-b'} ${className}`}>
      <GoalAnimation homeScore={homeScore} awayScore={awayScore} />

      <div
        onClick={() => {
          if (matchId && matchDate && homeId && awayId) {
            setIsTimelineExpanded(!isTimelineExpanded);
          }
        }}
        className={`flex items-center w-full px-0 sm:px-3 text-sm ${HEIGHT} ${textMuted}`}
      >
        {/* Estado (Apartado extra a la izquierda para tiempo) */}
        <div
          title={isFinished ? 'Finalizado' : isCancelled ? 'Cancelado' : undefined}
          className={`shrink-0 w-8 sm:w-12 flex items-center justify-center text-center text-xs font-bold uppercase tracking-tighter ${isCancelled ? (textAlert || 'text-amber-500') : isLive ? `${textError} animate-pulse` : ''
            }`}
        >
          {isCancelled ? <Ban size={14} strokeWidth={2.5} /> : statusLabel}
        </div>

        {/* Contenido principal: Local + Marcador + Visitante */}
        <div className="flex-grow flex items-center overflow-hidden min-w-0">
          {/* Equipo Local */}
          <TeamLink id={homeId} name={homeName} logo={homeLogo} idDM={homeIdDM} isRight />

          {/* Marcador */}
          <div className="flex-shrink-0 flex justify-center w-16 sm:w-28 gap-1 sm:gap-2 tabular-nums">
            {/* Penalty Local (Espacio reservado) */}
            {!((homeScore === null || homeScore === undefined) && (awayScore === null || awayScore === undefined) && matchTime) && (
              <div className="flex-1 flex justify-end">
                {(homePenalty !== undefined && homePenalty !== null) && (
                  <span className={`${textMuted} font-normal text-xs sm:text-sm`}>({homePenalty})</span>
                )}
              </div>
            )}

            {/* Goles u Horario */}
            <div className="flex gap-1 sm:gap-2 font-bold min-w-[20px] sm:min-w-[32px] justify-center text-xs sm:text-sm">
              {(homeScore === null || homeScore === undefined) && (awayScore === null || awayScore === undefined) && matchTime ? (
                <span className={`${textMuted} font-normal`}>{matchTime}</span>
              ) : (
                <>
                  <span className={isLive ? textError : textProminent}>{homeScore ?? '-'}</span>
                  <span className={`${textMuted} font-normal opacity-40`}>:</span>
                  <span className={isLive ? textError : textProminent}>{awayScore ?? '-'}</span>
                </>
              )}
            </div>

            {/* Penalty Visita (Espacio reservado) */}
            {!((homeScore === null || homeScore === undefined) && (awayScore === null || awayScore === undefined) && matchTime) && (
              <div className="flex-1 flex justify-start">
                {(awayPenalty !== undefined && awayPenalty !== null) && (
                  <span className={`${textMuted} font-normal text-xs sm:text-sm`}>({awayPenalty})</span>
                )}
              </div>
            )}
          </div>

          {/* Equipo Visitante */}
          <TeamLink id={awayId} name={awayName} logo={awayLogo} idDM={awayIdDM} />
        </div>

        {/* Arrow Expander */}
        <div
          className={`shrink-0 w-8 sm:w-12 flex items-center justify-center cursor-pointer ${matchId && matchDate && homeId && awayId ? 'text-neutral-400 dark:text-neutral-500' : 'opacity-0 pointer-events-none'}`}
        >
          <ChevronDown size={16} className={`transition-transform duration-200 ${isTimelineExpanded ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {/* Timeline Expansion */}
      {isTimelineExpanded && matchId && matchDate && homeId && awayId && (
        <MatchEventsTimeline
          matchId={matchId}
          matchDate={matchDate}
          homeId={homeId}
          awayId={awayId}
          homeIdDM={homeIdDM}
          awayIdDM={awayIdDM}
          homeScore={homeScore}
          awayScore={awayScore}
          matchNotes={matchNotes}
        />
      )}
    </div>
  );
}

/**
 * DetailsRow — Fila de detalles (goleadores, incidencias, etc.)
 * Estructura simplificada con altura reducida (h-6).
 */
export function DetailsRow({ children, className = '', noBorder = false }: { children: ReactNode; className?: string; noBorder?: boolean }) {
  const { bgApp, bgSurface, border, textMuted } = useThemeClasses();

  return (
    <div className={`grid items-center w-full ${HEIGHT_DETAILS} ${bgSurface} sm:${bgApp} ${border} border-b text-xs leading-tight ${noBorder ? '!border-b-0' : ''} ${className}`}>
      <div className={`px-2 ${textMuted} overflow-hidden min-w-0`}>
        {children}
      </div>
    </div>
  );
}
