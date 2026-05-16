import type { TabConfig } from '../tabTypes'
import EmptyState from '../../components/ui/EmptyState'

export const tabConfig: TabConfig = {
  id: 'squad',
  label: 'Plantel',
  order: 2,
  disabled: true,
}

export default function PlantelTab() {
  return <EmptyState message="Próximamente" />
}
