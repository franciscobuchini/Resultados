import type { TabConfig } from '../tabTypes'
import EmptyState from '../../components/ui/EmptyState'

export const tabConfig: TabConfig = {
  id: 'history',
  label: 'Historia',
  order: 3,
  disabled: true,
}

export default function HistoriaTab() {
  return <EmptyState message="Próximamente" />
}
