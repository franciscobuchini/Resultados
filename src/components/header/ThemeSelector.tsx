import { Palette } from 'lucide-react'
import { useTheme } from '../../functions/themeStore'
import type { ThemeName } from '../../functions/themeStore'
import { Dropdown, DropdownSection, DropdownItem } from '../ui/Dropdown'

export const THEME_OPTIONS: { label: string; value: ThemeName }[] = [
  // Dark Themes
  { label: 'Slate Dark',   value: 'slate-dark'   },
  { label: 'Gray Dark',    value: 'gray-dark'    },
  { label: 'Zinc Dark',    value: 'zinc-dark'    },
  { label: 'Neutral Dark', value: 'neutral-dark' },
  { label: 'Stone Dark',   value: 'stone-dark'   },
  { label: 'Taupe Dark',   value: 'taupe-dark'   },
  { label: 'Mauve Dark',   value: 'mauve-dark'   },
  { label: 'Mist Dark',    value: 'mist-dark'    },
  { label: 'Olive Dark',   value: 'olive-dark'   },
  // Light Themes
  { label: 'Slate Light',   value: 'slate-light'   },
  { label: 'Gray Light',    value: 'gray-light'    },
  { label: 'Zinc Light',    value: 'zinc-light'    },
  { label: 'Neutral Light', value: 'neutral-light' },
  { label: 'Stone Light',   value: 'stone-light'   },
  { label: 'Taupe Light',   value: 'taupe-light'   },
  { label: 'Mauve Light',   value: 'mauve-light'   },
  { label: 'Mist Light',    value: 'mist-light'    },
  { label: 'Olive Light',   value: 'olive-light'   },
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
