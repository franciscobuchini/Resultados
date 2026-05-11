import { Palette } from 'lucide-react'
import { useTheme } from '../../functions/themeStore'
import type { ThemeName } from '../../functions/themeStore'
import { Dropdown, DropdownSection, DropdownItem } from '../ui/Dropdown'

export const THEME_OPTIONS: { label: string; value: ThemeName }[] = [
  { label: 'Slate',   value: 'slate'   },
  { label: 'Gray',    value: 'gray'    },
  { label: 'Zinc',    value: 'zinc'    },
  { label: 'Neutral', value: 'neutral' },
  { label: 'Stone',   value: 'stone'   },
  { label: 'Taupe',   value: 'taupe'   },
  { label: 'Mauve',   value: 'mauve'   },
  { label: 'Mist',    value: 'mist'    },
  { label: 'Olive',   value: 'olive'   },
]

function ThemeItems() {
  const { currentTheme, setTheme } = useTheme()
  return THEME_OPTIONS.map((opt) => (
    <DropdownItem
      key={opt.value}
      onClick={() => setTheme(opt.value)}
      isActive={currentTheme === opt.value}
    >
      <span>{opt.label}</span>
    </DropdownItem>
  ))
}

/** Standalone: dropdown flotante para usar en el header */
export default function ThemeSelector() {
  const { currentTheme } = useTheme()

  return (
    <Dropdown
      align="left"
      widthClass="w-48"
      icon={Palette}
      value={<span className="capitalize">{currentTheme}</span>}
    >
      <ThemeItems />
    </Dropdown>
  )
}

/** Embebido: sección con panel lateral para usar dentro de UserMenu */
export function ThemeSectionMenu() {
  const { currentTheme } = useTheme()

  return (
    <DropdownSection
      icon={Palette}
      label="Tema"
      value={<span className="capitalize">{currentTheme}</span>}
    >
      <ThemeItems />
    </DropdownSection>
  )
}
