
import { useTime } from '../../functions/time'
import { Dropdown, DropdownItem } from '../ui/Dropdown'
import { Globe } from 'lucide-react'

const OFFSETS = [
  { label: 'USW (UTC-7)', value: -7 },
  { label: 'USE (UTC-4)', value: -4 },
  { label: 'ARG (UTC-3)', value: -3 },
  { label: 'GMT (UTC+0)', value: 0 },
  { label: 'ESP (UTC+1)', value: 1 },
  { label: 'EUR (UTC+2)', value: 2 },
]

export default function UtcSelector() {
  const { utcOffset: currentOffset, setUtcOffset: onOffsetChange } = useTime()

  return (
    <Dropdown 
      align="right" 
      widthClass="w-32"
      icon={Globe}
      label="Zona:"
      value={OFFSETS.find(o => o.value === currentOffset)?.label || `UTC${currentOffset >= 0 ? '+' : ''}${currentOffset}`}
    >
      {OFFSETS.map((opt) => (
        <DropdownItem
          key={opt.value}
          onClick={() => onOffsetChange(opt.value)}
          isActive={currentOffset === opt.value}
        >
          <span>{opt.label}</span>
        </DropdownItem>
      ))}
    </Dropdown>
  )
}
