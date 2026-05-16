import { useEffect, useState } from 'react';
import { ArrowRightLeft, MonitorPlay } from 'lucide-react';
import { useThemeClasses } from '../../functions/themeStore';

interface FixtureEvent {
  minute: number;
  event_type: string;
  team_id: number;
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

export default function MatchEventsTimeline({ matchId, matchDate, homeId, awayId, homeIdDM, awayIdDM }: MatchEventsTimelineProps) {
  const [events, setEvents] = useState<FixtureEvent[]>([]);
  const [loading, setLoading] = useState(!!(matchDate && matchId));
  const [error, setError] = useState(false);
  const { bgApp, border, textMuted, textMain, textError, textAccent } = useThemeClasses();

  useEffect(() => {
    if (!matchDate || !matchId) return;

    const fetchEvents = async () => {
      try {
        setLoading(true);
        // Usamos la API pública de DR (misma lógica que get-fixtures edge function)
        // Ya que la url es VITE_SUPABASE_URL, la reconstruimos:
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-fixtures?date=${matchDate}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('API Error');
        const data = await res.json();
        
        const fixture = data.find((f: { id: string | number; fixture_events?: FixtureEvent[] }) => f.id.toString() === matchId);
        if (fixture && fixture.fixture_events) {
          // Filtramos solo los eventos validos
          const validEvents = fixture.fixture_events.filter((e: FixtureEvent) => e.is_valid);
          // Ordenamos por minuto
          validEvents.sort((a: FixtureEvent, b: FixtureEvent) => {
            if (a.minute !== b.minute) return a.minute - b.minute;
            return (a.extra_minute || 0) - (b.extra_minute || 0);
          });
          setEvents(validEvents);
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
      <div className={`p-4 text-center text-xs ${textMuted} ${bgApp} border-t ${border}`}>
        Cargando eventos...
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 text-center text-xs ${textError} ${bgApp} border-t ${border}`}>
        No se pudieron cargar los eventos del partido.
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className={`p-4 text-center text-xs ${textMuted} ${bgApp} border-t ${border}`}>
        No hay eventos registrados para este partido.
      </div>
    );
  }

  return (
    <div className={`px-2 pb-4 sm:px-6 w-full text-xs ${bgApp} `}>
      <div className="relative w-full mx-auto">
        <div className="flex flex-col gap-2">
          {events.map((event, idx) => {
            const isHome = event.team_id.toString() === homeId || (homeIdDM && event.team_id.toString() === homeIdDM.toString());
            const isAway = event.team_id.toString() === awayId || (awayIdDM && event.team_id.toString() === awayIdDM.toString());
            const icon = getEventIcon(event.event_type, event.details?.addition || '', textAccent);
            
            // Si el evento no es de local ni visitante (raro, pero por si acaso) lo centramos.
            // Si no tiene icono, no mostramos nada raro
            if (!icon && !event.player_name) return null;

            return (
              <div key={`${event.minute}-${idx}`} className="flex items-center w-full relative z-10 group">
                
                {/* Home Side */}
                <div className="flex-1 flex justify-end items-center gap-1.5 sm:gap-2 pr-2 sm:pr-4 min-w-0 text-[10px] sm:text-xs">
                  {isHome && (
                    <>
                      <span className={`${textMain} text-right truncate`}>{event.player_name}</span>
                      <span className="shrink-0 flex items-center justify-center">{icon}</span>
                    </>
                  )}
                </div>

                {/* Center Minute */}
                <div className={`w-10 h-6 flex items-center justify-center shrink-0 text-[10px] sm:text-xs font-bold ${textMuted}`}>
                  {event.minute}'{event.extra_minute ? `+${event.extra_minute}` : ''}
                </div>

                {/* Away Side */}
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
          })}
        </div>
      </div>
    </div>
  );
}
