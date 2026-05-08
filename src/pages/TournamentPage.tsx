import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../functions/supabase'
import PageBanner from '../layout/PageBanner'
import StandingsTable from '../components/tournament/StandingsTable'
import FixtureTable from '../components/tournament/FixtureTable'
import Error404 from './Error404'
import { computeStandings } from '../../shared/tournament/computeStandings'
import type { TournamentSystem } from '../../shared/tournament/tournamentTypes'
import type { Match } from '../../shared/tournament/matchTypes'
import { useTime, toLocal } from '../functions/time'
import { useThemeClasses } from '../functions/themeStore'

// ------------------------------------------------------------
// TIPOS
// ------------------------------------------------------------

interface TeamInfo {
  team_id: string
  team_name: string | null
  team_shortname: string | null
  team_crest_url: string | null
}

interface Tournament {
  tournament_id: string
  tournament_name: string
  tournament_crest_url: string | null
  tournament_banner_url: string | null
  tournament_teams: Record<string, string[]> | null
  tournament_system: TournamentSystem | null
}

// ------------------------------------------------------------
// HELPERS
// ------------------------------------------------------------

/** Determina si un partido está finalizado según el status de la API */
const isFinished = (status: string | null): boolean =>
  status === 'FT' || status === 'AET' || status === 'PEN'

/** Determina si un match_round es una fecha numérica */
const isMatchday = (round: string): boolean =>
  /^\d+$/.test(round.trim())

// ------------------------------------------------------------
// COMPONENTE
// ------------------------------------------------------------

export default function TournamentPage() {
  const { tournamentId } = useParams<{ tournamentId: string }>()
  const [loading, setLoading] = useState(true)
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [matches, setMatches] = useState<Match[]>([])
  const [teamLookup, setTeamLookup] = useState<Record<string, TeamInfo>>({})
  const [selectedRound, setSelectedRound] = useState<string | null>(null)
  const { utcOffset } = useTime();
  const { border, textMain, textMuted } = useThemeClasses();

  useEffect(() => {
    if (!tournamentId) return

    const fetchData = async () => {
      setLoading(true)

      const { data: tournaments } = await supabase
        .from('tournaments')
        .select('tournament_id, tournament_name, tournament_crest_url, tournament_banner_url, tournament_teams, tournament_system')
        .eq('tournament_id', tournamentId)
        .limit(1)

      if (!tournaments || tournaments.length === 0) {
        setLoading(false)
        return
      }

      const tourney = tournaments[0] as Tournament
      setTournament(tourney)

      const { data: matchData } = await supabase
        .from('matches')
        .select('*')
        .eq('tournament_id', tournamentId)
        .order('match_date', { ascending: true })
        .order('match_time_utc', { ascending: true })

      const fetchedMatches = (matchData || []) as Match[]
      setMatches(fetchedMatches)

      // Seleccionar la primera fecha disponible por defecto (numérica si existe, si no la primera que haya)
      const rounds = Array.from(new Set(fetchedMatches.map(m => m.match_round).filter(Boolean))) as string[]
      const firstMatchday = rounds.filter(isMatchday).sort((a, b) => parseInt(a) - parseInt(b))[0]
      setSelectedRound(firstMatchday ?? rounds[0] ?? null)

      // Traer info de equipos
      const teamIds = Array.from(new Set([
        ...fetchedMatches.map(m => m.home_id),
        ...fetchedMatches.map(m => m.away_id)
      ])).filter(Boolean) as string[]

      if (teamIds.length > 0) {
        const { data: teams } = await supabase
          .from('teams')
          .select('team_id, team_name, team_shortname, team_crest_url')
          .in('team_id', teamIds)

        if (teams) {
          const lookup: Record<string, TeamInfo> = {}
          teams.forEach(t => { lookup[t.team_id] = t as TeamInfo })
          setTeamLookup(lookup)
        }
      }

      setLoading(false)
    }

    fetchData()
  }, [tournamentId])

  // ------------------------------------------------------------
  // ESTADOS DE CARGA Y ERROR
  // ------------------------------------------------------------

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className={`w-12 h-12 border-4 ${border} border-t-current ${textMain} rounded-full animate-spin`} />
    </div>
  )

  if (!tournament) return <Error404 />

  // ------------------------------------------------------------
  // DATOS DERIVADOS
  // ------------------------------------------------------------

  const groups = tournament.tournament_teams ?? {}
  const groupKeys = Object.keys(groups).sort()
  const system = tournament.tournament_system

  // Nombres de equipos para computeStandings
  const teamNames: Record<string, string> = {}
  Object.values(teamLookup).forEach(t => {
    if (t.team_name) teamNames[t.team_id] = t.team_name
  })

  // Partidos de la fase de liga (fechas numéricas)
  const leagueMatches = matches.filter(m =>
    m.match_round !== null && isMatchday(m.match_round) && isFinished(m.match_status)
  )

  // Tabla de posiciones usando el sistema del torneo
  const standings = system
    ? computeStandings(
      leagueMatches,
      groups,
      teamNames,
      system.phases.find(p => p.type === 'league') as Parameters<typeof computeStandings>[3],
      system.tiebreakers
    )
    : {}

  // Rounds disponibles para el selector
  const allRounds = Array.from(new Set(matches.map(m => m.match_round).filter(Boolean))) as string[]
  const matchdayRounds = allRounds.filter(isMatchday).sort((a, b) => parseInt(a) - parseInt(b))
  const knockoutRounds = allRounds.filter(r => !isMatchday(r))
  const sortedRounds = [...matchdayRounds, ...knockoutRounds]
  const currentIndex = sortedRounds.indexOf(selectedRound ?? '')


  // Partidos del round seleccionado, convertidos a hora local y ordenados cronológicamente
  const filteredMatches = matches.filter(m => m.match_round === selectedRound);

  const localizedMatches = filteredMatches.map(m => ({
    match: m,
    local: toLocal(m.match_date, m.match_time_utc, utcOffset),
  }));

  // Ordenar por timestamp local
  localizedMatches.sort((a, b) => a.local.timestamp - b.local.timestamp);

  // Agrupar por fecha local
  const matchesByDate: Record<string, Match[]> = {};
  for (const { match, local } of localizedMatches) {
    const dateKey = local.date || 'TBD';
    if (!matchesByDate[dateKey]) matchesByDate[dateKey] = [];
    matchesByDate[dateKey].push(match);
  }

  // ------------------------------------------------------------
  // RENDER
  // ------------------------------------------------------------

  return (
    <>
      <PageBanner
        title={tournament.tournament_name}
        tournament_banner_url={tournament.tournament_banner_url}
        logo={tournament.tournament_crest_url}
      />

      <div className="max-w-[1600px] mx-auto p-8">

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Tabla de posiciones */}
          <div className="lg:col-span-6">
            <div className="flex flex-col gap-8">
              {groupKeys.map(group => (
                <StandingsTable
                  key={group}
                  title={group}
                  standings={standings[group] ?? []}
                  teamLookup={teamLookup}
                />
              ))}
            </div>
          </div>

          {/* Partidos del round seleccionado */}
          <div className="lg:col-span-6 flex flex-col gap-4">

            {selectedRound ? (
              <FixtureTable
                roundName={isMatchday(selectedRound) ? `Fecha ${selectedRound}` : selectedRound}
                matchesByDate={matchesByDate}
                teamLookup={teamLookup}
                onPrevRound={currentIndex > 0 ? () => setSelectedRound(sortedRounds[currentIndex - 1]) : undefined}
                onNextRound={currentIndex < sortedRounds.length - 1 ? () => setSelectedRound(sortedRounds[currentIndex + 1]) : undefined}
              />
            ) : (
              <div className={`h-64 flex items-center justify-center border ${border} rounded-2xl ${textMuted} font-medium italic`}>
                No hay partidos programados
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  )
}