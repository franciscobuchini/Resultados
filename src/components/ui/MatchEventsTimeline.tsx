import { useEffect, useState } from 'react';
import { ArrowRightLeft, MonitorPlay } from 'lucide-react';
import { supabase } from '../../functions/supabase';
import { useThemeClasses } from '../../functions/themeStore';
import type { Goal } from '../../../shared/tournament/matchTypes';

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
  matchNotes?: string | null;
}

const getEventIcon = (eventType: string, details: string, textAccent: string) => {
  const type = eventType.toLowerCase();
  if (type.includes('goal') || type.includes('penalty')) {
    if (type.includes('miss')) return <span title="Penal Fallado">❌</span>;
    if (details.toLowerCase().includes('own goal')) return <span title="Gol en Contra">⚽ (EC)</span>;
    return <span title="Gol">⚽</span>;
  }
  if (type.includes('yellow/red')) return <span title="Doble Amarilla">🟨🟥</span>;
  if (type.includes('yellowcard')) return <span title="Amarilla">🟨</span>;
  if (type.includes('redcard')) return <span title="Roja">🟥</span>;
  if (type.includes('substitution')) return <span title="Cambio"><ArrowRightLeft size={14} className={textAccent} /></span>;
  if (type.includes('var')) return <span title="VAR"><MonitorPlay size={14} className={textAccent} /></span>;
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

export default function MatchEventsTimeline({ matchId, matchDate, homeId, awayId, homeIdDM, awayIdDM, matchNotes }: MatchEventsTimelineProps) {
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
        try {
          const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-fixtures?date=${matchDate}`;
          const res = await fetch(url);
          if (res.ok) {
            const data = await res.json();
            const fixture = data.find((f: { id: string | number; fixture_events?: FixtureEvent[] }) => f.id.toString() === matchId);
            if (fixture && fixture.fixture_events) {
              apiEvents = fixture.fixture_events
                .filter((e: FixtureEvent) => e.is_valid)
                .sort((a: FixtureEvent, b: FixtureEvent) => {
                  if (a.minute !== b.minute) return a.minute - b.minute;
                  return (a.extra_minute || 0) - (b.extra_minute || 0);
                });
            }
          }
        } catch {
          // API no disponible, seguimos con el fallback
        }

        // 2. Si la API devolvió eventos, usarlos
        if (apiEvents.length > 0) {
          setEvents(apiEvents);
          return;
        }

        // 3. Fallback: buscar goles en la tabla goals de Supabase
        const { data: goalsData } = await supabase
          .from('goals')
          .select('*')
          .eq('match_id', matchId)
          .order('goal_minute', { ascending: true });

        if (goalsData && goalsData.length > 0) {
          setEvents(goalsData.map((g: Goal) => goalToEvent(g)));
        } else {
          setEvents([]);
        }
      } catch (err) {
        console.error(err);
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
              No hay eventos registrados
            </div>
          ) : (
            events.map((event, idx) => {
              const isHome = event.team_id.toString() === homeId || (homeIdDM && event.team_id.toString() === homeIdDM.toString());
              const isAway = event.team_id.toString() === awayId || (awayIdDM && event.team_id.toString() === awayIdDM.toString());
              const icon = getEventIcon(event.event_type, event.details?.addition || '', textAccent);
              
              if (!icon && !event.player_name) return null;

              return (
                <div key={`${event.minute}-${idx}`} className="flex items-center w-full relative z-10 group">
                  <div className="flex-1 flex justify-end items-center gap-1.5 sm:gap-2 pr-2 sm:pr-4 min-w-0 text-[10px] sm:text-xs">
                    {isHome && (
                      <>
                        <span className={`${textMain} text-right truncate`}>{event.player_name}</span>
                        <span className="shrink-0 flex items-center justify-center">{icon}</span>
                      </>
                    )}
                  </div>

                  <div className={`w-10 h-6 flex items-center justify-center shrink-0 text-[10px] sm:text-xs font-bold ${textMuted}`}>
                    {event.minute}'{event.extra_minute ? `+${event.extra_minute}` : ''}
                  </div>

                  <div className="flex-1 flex justify-start items-center gap-1.5 sm:gap-2 pl-2 sm:pl-4 min-w-0 text-[10px] sm:text-xs">
                    {isAway && (
                      <>
                        <span className="shrink-0 flex items-center justify-center">{icon}</span>
                        <span className={`${textMain} text-left truncate`}>{event.player_name}</span>
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
