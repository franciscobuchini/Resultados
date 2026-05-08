
import { useTheme } from '../../functions/themeStore'
import type { ThemeName } from '../../functions/themeStore'
import { Palette } from 'lucide-react'
import { Dropdown, DropdownItem } from '../ui/Dropdown'

const THEME_OPTIONS: { label: string; value: ThemeName }[] = [
  { label: 'Slate', value: 'slate' },
  { label: 'Gray', value: 'gray' },
  { label: 'Zinc', value: 'zinc' },
  { label: 'Neutral', value: 'neutral' },
  { label: 'Stone', value: 'stone' },
  { label: 'Taupe', value: 'taupe' },
  { label: 'Mauve', value: 'mauve' },
  { label: 'Mist', value: 'mist' },
  { label: 'Olive', value: 'olive' },
]

export default function ThemeSelector() {
  const { currentTheme, setTheme } = useTheme()

  return (
    <Dropdown 
      align="left" 
      widthClass="w-48"
      icon={Palette}
      label="Tema:"
      value={<span className="capitalize">{currentTheme}</span>}
    >
      {THEME_OPTIONS.map((opt) => (
        <DropdownItem
          key={opt.value}
          onClick={() => setTheme(opt.value)}
          isActive={currentTheme === opt.value}
        >
          <span>{opt.label}</span>
          {currentTheme === opt.value && (
            <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
          )}
        </DropdownItem>
      ))}
    </Dropdown>
  )
}
