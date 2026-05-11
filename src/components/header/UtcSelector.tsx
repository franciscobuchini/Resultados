import { Globe } from 'lucide-react'
import { useTime } from '../../functions/time'
import { Dropdown, DropdownSection, DropdownItem } from '../ui/Dropdown'

export const UTC_OFFSETS: { label: string; value: number }[] = [
  { label: 'USW (UTC-7)', value: -7 },
  { label: 'USE (UTC-4)', value: -4 },
  { label: 'ARG (UTC-3)', value: -3 },
  { label: 'GMT (UTC+0)', value:  0 },
  { label: 'ESP (UTC+1)', value:  1 },
  { label: 'EUR (UTC+2)', value:  2 },
]

function useUtcLabel(utcOffset: number) {
  return (
    UTC_OFFSETS.find((o) => o.value === utcOffset)?.label ??
    `UTC${utcOffset >= 0 ? '+' : ''}${utcOffset}`
  )
}

function UtcItems() {
  const { utcOffset, setUtcOffset } = useTime()
  return UTC_OFFSETS.map((opt) => (
    <DropdownItem
      key={opt.value}
      onClick={() => setUtcOffset(opt.value)}
      isActive={utcOffset === opt.value}
    >
      <span>{opt.label}</span>
    </DropdownItem>
  ))
}

/** Standalone: dropdown flotante para usar en el header */
export default function UtcSelector() {
  const { utcOffset } = useTime()

  return (
    <Dropdown
      align="right"
      widthClass="w-32"
      icon={Globe}
      value={useUtcLabel(utcOffset)}
    >
      <UtcItems />
    </Dropdown>
  )
}

/** Embebido: sección con panel lateral para usar dentro de UserMenu */
export function UtcSectionMenu() {
  const { utcOffset } = useTime()

  return (
    <DropdownSection
      icon={Globe}
      label="Zona"
      value={useUtcLabel(utcOffset)}
    >
      <UtcItems />
    </DropdownSection>
  )
}
