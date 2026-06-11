import { useEffect, useState } from 'react';
import { ArrowRightLeft, MonitorPlay } from 'lucide-react';
import { supabase } from '../../functions/supabase';
import { useThemeClasses } from '../../functions/themeStore';
import type { Goal } from '../../functions/computeStandings';
import { decryptPayload } from '../../functions/crypto';

interface FixtureEvent {
  minute: number;
  event_type: string;
  team_id: number | string;
  player_name: string | null;
  is_valid: boolean;
  extra_minute: number | null;
  details: { addition: string; sportmonks_type_id: number };
}

interface MatchEventsTimelineProps {
  matchId: string;
  matchDate: string | null;
  homeId: string;
  awayId: string;
  homeIdDM?: string | number | null;
  awayIdDM?: string | number | null;
  homeScore?: string | number | null;
  awayScore?: string | number | null;
  matchNotes?: string | null;
  statusLabel?: React.ReactNode;
}

const getEventIcon = (eventType: string, details: string, textAccent: string) => {
  const type = eventType.toLowerCase();
  if (type.includes('disallowed')) return <span title="Gol Anulado">❌</span>;
  if (type.includes('goal') || type.includes('penalty')) {
    if (type.includes('miss')) return <span title="Penal Fallado">❌</span>;
    if (details.toLowerCase().includes('own goal')) return <span title="Gol en Contra">⚽ (EC)</span>;
    return <span title="Gol">⚽</span>;
  }
  if (type.includes('yellow/red')) return <span title="Doble Amarilla">🟨🟥</span>;
  if (type.includes('yellowcard')) return <span title="Amarilla">🟨</span>;
  if (type.includes('redcard')) return <span title="Roja">🟥</span>;
  if (type.includes('substitution')) return <span title="Cambio"><ArrowRightLeft size={14} className={textAccent} /></span>;
  if (type.includes('var')) return <span title="Chequeo VAR"><MonitorPlay size={14} className={textAccent} /></span>;
  return null;
};

/** Convierte un Goal de la tabla goals de Supabase a FixtureEvent para el timeline */
const goalToEvent = (goal: Goal): FixtureEvent => {
  const goalTypeMap: Record<string, string> = {
    'G': 'Goal',
    'P': 'Penalty',
    'C': 'Goal', // own goal — se marca con details.addition
  };
  return {
    minute: goal.goal_minute ?? 0,
    event_type: goalTypeMap[goal.goal_type] || 'Goal',
    team_id: goal.team_id,
    player_name: goal.player_name,
    is_valid: true,
    extra_minute: null,
    details: {
      addition: goal.goal_type === 'C' ? 'Own Goal' : '',
      sportmonks_type_id: 0,
    },
  };
};

/**
 * reconcileGoals — Compara los goles de la API con el marcador final.
 * Si hay más goles registrados que goles en el resultado, los excedentes
 * se marcan como 'Disallowed Goal' (anulados).
 *
 * Usa homeIdDM / awayIdDM (IDs numéricos de la API) para identificar
 * correctamente a qué equipo pertenece cada evento.
 */
const reconcileGoals = (
  eventsList: FixtureEvent[],
  homeScore: string | number | null | undefined,
  awayScore: string | number | null | undefined,
  homeIdDM: string | number | null | undefined,
  awayIdDM: string | number | null | undefined,
): FixtureEvent[] => {
  // Solo reconciliar si tenemos marcador final y IDs de la API
  if (homeScore == null || awayScore == null || (!homeIdDM && !awayIdDM)) {
    return eventsList;
  }

  const isGoalEvent = (e: FixtureEvent) => {
    const tType = e.event_type.toLowerCase();
    return (tType.includes('goal') || tType.includes('penalty')) &&
      !tType.includes('miss') &&
      !tType.includes('disallowed') &&
      !tType.includes('shootout');
  };

  // Colectar goles válidos por equipo usando los IDs numéricos de la API
  const homeGoalEvents: FixtureEvent[] = [];
  const awayGoalEvents: FixtureEvent[] = [];

  eventsList.forEach(e => {
    if (!isGoalEvent(e)) return;
    const tid = e.team_id.toString();
    if (homeIdDM && tid === homeIdDM.toString()) {
      homeGoalEvents.push(e);
    } else if (awayIdDM && tid === awayIdDM.toString()) {
      awayGoalEvents.push(e);
    }
  });

  const markExcess = (goalEvents: FixtureEvent[], targetCount: number) => {
    const excess = goalEvents.length - targetCount;
    if (excess <= 0) return;

    let remaining = excess;

    // 1er pasada: goles sin nombre de jugador
    for (let i = goalEvents.length - 1; i >= 0 && remaining > 0; i--) {
      const e = goalEvents[i];
      if (!e.player_name || e.player_name.trim() === '') {
        e.event_type = 'Disallowed Goal';
        remaining--;
      }
    }

    // 2da pasada: goles que ocurrieron justo antes o en el mismo minuto que un chequeo de VAR
    for (let i = goalEvents.length - 1; i >= 0 && remaining > 0; i--) {
      const e = goalEvents[i];
      if (e.event_type === 'Disallowed Goal') continue;

      // Buscar si hay un evento VAR en los siguientes 5 minutos para este mismo equipo
      const hasVAR = eventsList.some(v =>
        v.event_type.toLowerCase().includes('var') &&
        v.minute >= e.minute &&
        v.minute <= e.minute + 5 &&
        v.team_id.toString() === e.team_id.toString()
      );

      if (hasVAR) {
        e.event_type = 'Disallowed Goal';
        remaining--;
      }
    }

    // 3ra pasada: si todavía hay exceso (la API mandó un gol de más sin VAR ni nada),
    // marcamos el más reciente como anulado, pero MANTENEMOS su nombre.
    for (let i = goalEvents.length - 1; i >= 0 && remaining > 0; i--) {
      const e = goalEvents[i];
      if (e.event_type !== 'Disallowed Goal') {
        e.event_type = 'Disallowed Goal';
        remaining--;
      }
    }
  };

  markExcess(homeGoalEvents, Number(homeScore));
  markExcess(awayGoalEvents, Number(awayScore));

  return eventsList;
};

export default function MatchEventsTimeline({ matchId, matchDate, homeId, awayId, homeIdDM, awayIdDM, homeScore, awayScore, matchNotes, statusLabel }: MatchEventsTimelineProps) {
  const [events, setEvents] = useState<FixtureEvent[]>([]);
  const [loading, setLoading] = useState(!!(matchDate && matchId));
  const [error, setError] = useState(false);
  const { bgApp, bgSurface, textMuted, textMain, textError, textAccent } = useThemeClasses();

  useEffect(() => {

    if (!matchDate || !matchId) return;

    const fetchEvents = async () => {
      try {
        setLoading(true);

        // 1. Intentar cargar eventos de la API de DataRedonda
        let apiEvents: FixtureEvent[] = [];
        
        // Helper: intenta buscar el fixture en la respuesta de una fecha dada
        const tryFetchForDate = async (dateStr: string): Promise<FixtureEvent[]> => {
          const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-fixtures?date=${dateStr}&encrypt=true`;
          const res = await fetch(url, {
            headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            }
          });
          if (!res.ok) return [];
          
          const rawText = await res.text();
          const decrypted = decryptPayload(rawText);
          const fixturesList = Array.isArray(decrypted)
            ? decrypted
            : (decrypted && Array.isArray(decrypted.data) ? decrypted.data : []);
          
          const fixture = fixturesList.find((f: any) => {
            if (!f) return false;
            if (f.id && f.id.toString() === matchId) return true;
            if (f.sportmonks_id && f.sportmonks_id.toString() === matchId) return true;
            if (homeIdDM && awayIdDM &&
                f.home_team_id?.toString() === homeIdDM.toString() &&
                f.away_team_id?.toString() === awayIdDM.toString()) {
              return true;
            }
            return false;
          });
          
          if (!fixture || !Array.isArray(fixture.fixture_events)) return [];
          
          let events = fixture.fixture_events.filter((e: FixtureEvent) => e.is_valid);
          // Deduplicar por minuto + tipo + jugador + equipo
          const seen = new Set<string>();
          events = events.filter((e: FixtureEvent) => {
            const key = `${e.minute}-${e.extra_minute ?? 0}-${e.event_type}-${e.player_name ?? ''}-${e.team_id}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          }).sort((a: FixtureEvent, b: FixtureEvent) => {
            const aIsShootout = a.event_type.toLowerCase().includes('shootout');
            const bIsShootout = b.event_type.toLowerCase().includes('shootout');
            if (aIsShootout && !bIsShootout) return 1;
            if (!aIsShootout && bIsShootout) return -1;
            if (a.minute !== b.minute) return a.minute - b.minute;
            return (a.extra_minute || 0) - (b.extra_minute || 0);
          });
          
          return events;
        };

        try {
          // Intentar con la fecha del partido (puede ser UTC)
          apiEvents = await tryFetchForDate(matchDate!);
          
          // Si no se encontró, probar con el día anterior
          // (DataRedonda usa fecha local, pero match_date puede ser UTC)
          if (apiEvents.length === 0) {
            const prevDay = new Date(matchDate + 'T12:00:00');
            prevDay.setDate(prevDay.getDate() - 1);
            const prevDateStr = prevDay.toISOString().split('T')[0];
            apiEvents = await tryFetchForDate(prevDateStr);
          }
        } catch {
          // API no disponible, seguimos con el fallback
        }

        // 2. Si la API devolvió eventos, reconciliar goles con el marcador final
        if (apiEvents.length > 0) {
          setEvents(reconcileGoals(apiEvents, homeScore, awayScore, homeIdDM, awayIdDM));
          return;
        }

        // 3. Fallback: buscar goles en la tabla goals de Supabase
        const { data: goalsData } = await supabase
          .from('goals')
          .select('*')
          .eq('match_id', matchId)
          .order('goal_minute', { ascending: true });

        if (goalsData && goalsData.length > 0) {
          const mappedEvents = goalsData.map((g: Goal) => goalToEvent(g));
          setEvents(mappedEvents);
        } else {
          setEvents([]);
        }
      } catch (err) {

        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [matchId, matchDate]);

  if (loading) {
    return (
      <div className={`h-12 flex items-center justify-center text-xs ${textMuted} ${bgSurface} sm:${bgApp}`}>
        Cargando eventos...
      </div>
    );
  }

  if (error) {
    return (
      <div className={`h-12 flex items-center justify-center text-xs ${textError} ${bgSurface} sm:${bgApp}`}>
        No se pudieron cargar los eventos del partido.
      </div>
    );
  }

  return (
    <div className={`px-2 pb-4 sm:px-6 w-full text-xs ${bgSurface} sm:${bgApp} `}>
      <div className="relative w-full mx-auto">
        <div className="flex flex-col gap-2">
          {/* Notas del partido (Siempre visibles) */}
          {matchNotes && (
            <div className={`pt-2 text-center ${textMuted}`}>
              {matchNotes}
            </div>
          )}

          {events.length === 0 ? (
            <div className={`h-12 flex items-center justify-center text-xs ${textMuted}`}>
              {statusLabel === 'C' ? 'Cancelado' : statusLabel === 'S' ? 'Suspendido' : 'No hay eventos registrados'}
            </div>
          ) : (
            events.map((event, idx) => {
              const isHome = event.team_id.toString() === homeId || (homeIdDM && event.team_id.toString() === homeIdDM.toString());
              const isAway = event.team_id.toString() === awayId || (awayIdDM && event.team_id.toString() === awayIdDM.toString());
              const icon = getEventIcon(event.event_type, event.details?.addition || '', textAccent);

              let displayPlayerName = event.player_name || '';
              const tType = event.event_type.toLowerCase();

              // Lógica específica para VAR
              if (tType.includes('var')) {
                const reasonRaw = event.details?.addition?.trim() || '';
                const playerRaw = event.player_name?.trim() || '';

                // Función para traducir y limpiar el texto del VAR
                const translateVarReason = (text: string) => {
                  const t = text.toLowerCase();
                  if (!t || t.includes('pending') || t === 'check' || t.includes('var')) return null;
                  if (t.includes('goal')) return 'Posible Gol';
                  if (t.includes('penalty')) return 'Posible Penal';
                  if (t.includes('red card') || t.includes('card upgrade')) return 'Posible Roja';
                  if (t.includes('yellow card')) return 'Posible Amarilla';

                  // Si no lo reconoce pero no es un texto basura de la API, lo deja como está
                  return text;
                };

                // Priorizamos el 'addition', si no probamos con el 'player_name'
                const rawText = reasonRaw || playerRaw;
                const translatedReason = translateVarReason(rawText);

                if (translatedReason) {
                  // Si logramos extraer y traducir un motivo válido
                  displayPlayerName = `Chequeo VAR (${translatedReason})`;
                } else {
                  // Si decía "Pending VAR" o cosas similares, lo ocultamos
                  displayPlayerName = 'Chequeo VAR';
                }
              }
              // Fallback: Si no hay nombre para el resto de eventos, usar el tipo como texto
              else if (!displayPlayerName || displayPlayerName.trim() === '') {
                if (tType.includes('substitution')) displayPlayerName = 'Cambio';
                else if (tType.includes('yellow/red')) displayPlayerName = 'Doble Amarilla';
                else if (tType.includes('yellowcard')) displayPlayerName = 'Tarjeta Amarilla';
                else if (tType.includes('redcard')) displayPlayerName = 'Tarjeta Roja';
                else if (tType.includes('disallowed')) displayPlayerName = 'Gol Anulado';
                else if (tType.includes('miss')) displayPlayerName = 'Penal Fallado';
                else if (tType.includes('goal') || tType.includes('penalty')) displayPlayerName = 'Gol';
                else displayPlayerName = 'Evento';
              } else {
                // Si sí hay nombre, añadir sufijos especiales si corresponde
                if ((tType.includes('goal') || tType.includes('penalty')) && tType.includes('miss')) {
                  const baseName = displayPlayerName.replace(' (Penal Fallado)', '').trim();
                  displayPlayerName = baseName === 'Penal Fallado' ? 'Penal Fallado' : `${baseName} (Penal Fallado)`;
                }
              }

              if (!icon && !displayPlayerName) return null;

              return (
                <div key={`${event.minute}-${idx}`} className="flex items-center w-full relative z-10 group">
                  <div className="flex-1 flex justify-end items-center gap-1.5 sm:gap-2 pr-2 sm:pr-4 min-w-0 text-[10px] sm:text-xs">
                    {isHome && (
                      <>
                        <span className={`${textMain} text-right truncate`}>{displayPlayerName}</span>
                        {icon && <span className="shrink-0 flex items-center justify-center">{icon}</span>}
                      </>
                    )}
                  </div>

                  <div className={`w-10 h-6 flex items-center justify-center shrink-0 text-[10px] sm:text-xs font-bold ${textMuted}`}>
                    {tType.includes('shootout')
                      ? `P${event.minute}`
                      : `${event.minute}'${event.extra_minute ? `+${event.extra_minute}` : ''}`}
                  </div>

                  <div className="flex-1 flex justify-start items-center gap-1.5 sm:gap-2 pl-2 sm:pl-4 min-w-0 text-[10px] sm:text-xs">
                    {isAway && (
                      <>
                        {icon && <span className="shrink-0 flex items-center justify-center">{icon}</span>}
                        <span className={`${textMain} text-left truncate`}>{displayPlayerName}</span>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
