import { useFixtures } from '../functions/useFixtures'
import PageContent from '../layout/PageContent'
import DateNavigator from '../components/navigation/DateNavigator'
import FixtureTable from '../components/tables/FixtureTable'
import EmptyState from '../components/ui/EmptyState'
import LoadingState from '../components/ui/LoadingState'
import { LAYOUT_CONFIG } from '../functions/layoutConfig'

export default function HomePage() {
  const { loading, dateLabel, adaptedLeagues, changeDate } = useFixtures()

  return (
      <PageContent maxWidth="1600">
        <DateNavigator dateLabel={dateLabel} onChangeDate={changeDate} />

        <div className="relative min-h-[400px]">
          {/* Overlay de carga para evitar saltos de layout */}
          {loading && adaptedLeagues.length > 0 && (
            <div className="absolute inset-0 z-10 flex items-start justify-center pt-20 bg-black/5 backdrop-blur-[2px] rounded-3xl transition-all duration-300">
              <div className="sticky top-40">
                <LoadingState />
              </div>
            </div>
          )}

          {loading && adaptedLeagues.length === 0 ? (
            <LoadingState />
          ) : adaptedLeagues.length === 0 ? (
            <EmptyState message="Sin partidos para esta fecha" />
          ) : (
            <div className={`flex flex-col ${LAYOUT_CONFIG.gap} transition-opacity duration-300 ${loading ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
              {adaptedLeagues.map((league) => (
                <FixtureTable
                  key={league.leagueName}
                  roundName={
                    <div className="flex items-center gap-2">
                      <img src={league.leagueLogo} className="w-5 h-5 object-contain" alt={league.leagueName} />
                      <span>{league.leagueName}</span>
                    </div>
                  }
                  matchesByDate={league.matchesByDate}
                  goals={league.goals}
                  teamLookup={league.teamLookup}
                  hideDateSeparators={true}
                />
              ))}
            </div>
          )}
        </div>
      </PageContent>
  )
}