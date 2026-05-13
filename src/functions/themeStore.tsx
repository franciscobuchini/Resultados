import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useEffect, type ReactNode } from 'react'
import logoLight from '../assets/ResultadosLogoLight.webp'
import logoDark from '../assets/ResultadosLogoDark.webp'

export type ThemeName =
  | 'zinc-dark' | 'stone-dark' | 'slate-dark' | 'neutral-dark' | 'gray-dark' | 'taupe-dark' | 'mauve-dark' | 'mist-dark' | 'olive-dark'
  | 'zinc-light' | 'stone-light' | 'slate-light' | 'neutral-light' | 'gray-light' | 'taupe-light' | 'mauve-light' | 'mist-light' | 'olive-light'

export interface ThemeClasses {
  // Backgrounds
  bgApp: string
  bgSurface: string
  bgSurfaceHover: string
  bgElement?: string
  bgElementHover?: string
  bgMain?: string

  // Borders
  border: string
  borderSubtle?: string

  // Text
  textMain: string
  textMuted: string
  textDimmed?: string
  textSubtle?: string
  textAccent: string
  textProminent: string
  textHover: string

  // States
  textSuccess?: string
  textError?: string
  bgProminent?: string
  logo: string
}

export const THEMES: Record<ThemeName, ThemeClasses> = {
  // ------------------------------------------------------------
  // DARK THEMES
  // ------------------------------------------------------------
  'zinc-dark': {
    bgApp: 'bg-zinc-950',
    bgSurface: 'bg-zinc-900',
    bgSurfaceHover: 'hover:bg-zinc-800',
    border: 'border-zinc-800',
    textMain: 'text-zinc-100',
    textMuted: 'font-normal text-zinc-400',
    textAccent: 'text-zinc-200',
    textProminent: 'font-black text-zinc-100',
    textHover: 'hover:text-zinc-100',
    textSuccess: 'text-green-400',
    textError: 'text-red-400',
    bgProminent: 'bg-zinc-800/50',
    bgMain: 'bg-black/10',
    logo: logoLight,
  },
  'stone-dark': {
    bgApp: 'bg-stone-950',
    bgSurface: 'bg-stone-900',
    bgSurfaceHover: 'hover:bg-stone-800',
    border: 'border-stone-800',
    textMain: 'text-stone-100',
    textMuted: 'font-normal text-stone-400',
    textAccent: 'text-stone-200',
    textProminent: 'font-black text-stone-100',
    textHover: 'hover:text-stone-100',
    textSuccess: 'text-green-400',
    textError: 'text-red-400',
    bgProminent: 'bg-stone-800/50',
    bgMain: 'bg-black/10',
    logo: logoLight,
  },
  'slate-dark': {
    bgApp: 'bg-slate-950',
    bgSurface: 'bg-slate-900',
    bgSurfaceHover: 'hover:bg-slate-800',
    border: 'border-slate-800',
    textMain: 'text-slate-100',
    textMuted: 'font-normal text-slate-400',
    textAccent: 'text-slate-200',
    textProminent: 'font-black text-slate-100',
    textHover: 'hover:text-slate-100',
    textSuccess: 'text-green-400',
    textError: 'text-red-400',
    bgProminent: 'bg-slate-800/50',
    bgMain: 'bg-black/10',
    logo: logoLight,
  },
  'neutral-dark': {
    bgApp: 'bg-neutral-950',
    bgSurface: 'bg-neutral-900',
    bgSurfaceHover: 'hover:bg-neutral-800',
    border: 'border-neutral-800',
    textMain: 'text-neutral-100',
    textMuted: 'font-normal text-neutral-400',
    textAccent: 'text-neutral-200',
    textProminent: 'font-black text-neutral-100',
    textHover: 'hover:text-neutral-100',
    textSuccess: 'text-green-400',
    textError: 'text-red-400',
    bgProminent: 'bg-neutral-800/50',
    bgMain: 'bg-black/10',
    logo: logoLight,
  },
  'gray-dark': {
    bgApp: 'bg-gray-950',
    bgSurface: 'bg-gray-900',
    bgSurfaceHover: 'hover:bg-gray-800',
    border: 'border-gray-800',
    textMain: 'text-gray-100',
    textMuted: 'font-normal text-gray-400',
    textAccent: 'text-gray-200',
    textProminent: 'font-black text-gray-100',
    textHover: 'hover:text-gray-100',
    textSuccess: 'text-green-400',
    textError: 'text-red-400',
    bgProminent: 'bg-gray-800/50',
    bgMain: 'bg-black/10',
    logo: logoLight,
  },
  'taupe-dark': {
    bgApp: 'bg-taupe-950',
    bgSurface: 'bg-taupe-900',
    bgSurfaceHover: 'hover:bg-taupe-800',
    border: 'border-taupe-800',
    textMain: 'text-taupe-100',
    textMuted: 'font-normal text-taupe-400',
    textAccent: 'text-taupe-200',
    textProminent: 'font-black text-taupe-100',
    textHover: 'hover:text-taupe-100',
    textSuccess: 'text-green-400',
    textError: 'text-red-400',
    bgProminent: 'bg-taupe-800/50',
    bgMain: 'bg-black/10',
    logo: logoLight,
  },
  'mauve-dark': {
    bgApp: 'bg-mauve-950',
    bgSurface: 'bg-mauve-900',
    bgSurfaceHover: 'hover:bg-mauve-800',
    border: 'border-mauve-800',
    textMain: 'text-mauve-100',
    textMuted: 'font-normal text-mauve-400',
    textAccent: 'text-mauve-200',
    textProminent: 'font-black text-mauve-100',
    textHover: 'hover:text-mauve-100',
    textSuccess: 'text-green-400',
    textError: 'text-red-400',
    bgProminent: 'bg-mauve-800/50',
    bgMain: 'bg-black/10',
    logo: logoLight,
  },
  'mist-dark': {
    bgApp: 'bg-mist-950',
    bgSurface: 'bg-mist-900',
    bgSurfaceHover: 'hover:bg-mist-800',
    border: 'border-mist-800',
    textMain: 'text-mist-100',
    textMuted: 'font-normal text-mist-400',
    textAccent: 'text-mist-200',
    textProminent: 'font-black text-mist-100',
    textHover: 'hover:text-mist-100',
    textSuccess: 'text-green-400',
    textError: 'text-red-400',
    bgProminent: 'bg-mist-800/50',
    bgMain: 'bg-black/10',
    logo: logoLight,
  },
  'olive-dark': {
    bgApp: 'bg-olive-950',
    bgSurface: 'bg-olive-900',
    bgSurfaceHover: 'hover:bg-olive-800',
    border: 'border-olive-800',
    textMain: 'text-olive-100',
    textMuted: 'font-normal text-olive-400',
    textAccent: 'text-olive-200',
    textProminent: 'font-black text-olive-100',
    textHover: 'hover:text-olive-100',
    textSuccess: 'text-green-400',
    textError: 'text-red-400',
    bgProminent: 'bg-olive-800/50',
    bgMain: 'bg-black/10',
    logo: '/src/assets/ResultadosLogoLight.webp',
  },

  // ------------------------------------------------------------
  // LIGHT THEMES
  // ------------------------------------------------------------
  'zinc-light': {
    bgApp: 'bg-zinc-100',
    bgSurface: 'bg-white',
    bgSurfaceHover: 'hover:bg-zinc-100',
    border: 'border-zinc-200',
    textMain: 'text-zinc-700',
    textMuted: 'font-normal text-zinc-500',
    textAccent: 'text-zinc-600',
    textProminent: 'font-black text-zinc-700',
    textHover: 'hover:text-zinc-950',
    textSuccess: 'text-green-600',
    textError: 'text-red-600',
    bgProminent: 'bg-zinc-100',
    bgMain: 'bg-white/40',
    logo: logoDark,
  },
  'stone-light': {
    bgApp: 'bg-stone-100',
    bgSurface: 'bg-white',
    bgSurfaceHover: 'hover:bg-stone-100',
    border: 'border-stone-200',
    textMain: 'text-stone-700',
    textMuted: 'font-normal text-stone-500',
    textAccent: 'text-stone-600',
    textProminent: 'font-black text-stone-700',
    textHover: 'hover:text-stone-950',
    textSuccess: 'text-green-600',
    textError: 'text-red-600',
    bgProminent: 'bg-stone-100',
    bgMain: 'bg-white/40',
    logo: logoDark,
  },
  'slate-light': {
    bgApp: 'bg-slate-100',
    bgSurface: 'bg-white',
    bgSurfaceHover: 'hover:bg-slate-100',
    border: 'border-slate-200',
    textMain: 'text-slate-700',
    textMuted: 'font-normal text-slate-500',
    textAccent: 'text-slate-600',
    textProminent: 'font-black text-slate-700',
    textHover: 'hover:text-slate-950',
    textSuccess: 'text-green-600',
    textError: 'text-red-600',
    bgProminent: 'bg-slate-100',
    bgMain: 'bg-white/40',
    logo: logoDark,
  },
  'neutral-light': {
    bgApp: 'bg-neutral-100',
    bgSurface: 'bg-white',
    bgSurfaceHover: 'hover:bg-neutral-100',
    border: 'border-neutral-200',
    textMain: 'text-neutral-700',
    textMuted: 'font-normal text-neutral-500',
    textAccent: 'text-neutral-600',
    textProminent: 'font-black text-neutral-700',
    textHover: 'hover:text-neutral-950',
    textSuccess: 'text-green-600',
    textError: 'text-red-600',
    bgProminent: 'bg-neutral-100',
    bgMain: 'bg-white/40',
    logo: logoDark,
  },
  'gray-light': {
    bgApp: 'bg-gray-100',
    bgSurface: 'bg-white',
    bgSurfaceHover: 'hover:bg-gray-100',
    border: 'border-gray-200',
    textMain: 'text-gray-700',
    textMuted: 'font-normal text-gray-500',
    textAccent: 'text-gray-600',
    textProminent: 'font-black text-gray-700',
    textHover: 'hover:text-gray-950',
    textSuccess: 'text-green-600',
    textError: 'text-red-600',
    bgProminent: 'bg-gray-100',
    bgMain: 'bg-white/40',
    logo: logoDark,
  },
  'taupe-light': {
    bgApp: 'bg-taupe-100',
    bgSurface: 'bg-white',
    bgSurfaceHover: 'hover:bg-taupe-100',
    border: 'border-taupe-200',
    textMain: 'text-taupe-700',
    textMuted: 'font-normal text-taupe-500',
    textAccent: 'text-taupe-600',
    textProminent: 'font-black text-taupe-700',
    textHover: 'hover:text-taupe-950',
    textSuccess: 'text-green-600',
    textError: 'text-red-600',
    bgProminent: 'bg-taupe-100',
    bgMain: 'bg-white/40',
    logo: logoDark,
  },
  'mauve-light': {
    bgApp: 'bg-mauve-100',
    bgSurface: 'bg-white',
    bgSurfaceHover: 'hover:bg-mauve-100',
    border: 'border-mauve-200',
    textMain: 'text-mauve-700',
    textMuted: 'font-normal text-mauve-500',
    textAccent: 'text-mauve-600',
    textProminent: 'font-black text-mauve-700',
    textHover: 'hover:text-mauve-950',
    textSuccess: 'text-green-600',
    textError: 'text-red-600',
    bgProminent: 'bg-mauve-100',
    bgMain: 'bg-white/40',
    logo: logoDark,
  },
  'mist-light': {
    bgApp: 'bg-mist-100',
    bgSurface: 'bg-white',
    bgSurfaceHover: 'hover:bg-mist-100',
    border: 'border-mist-200',
    textMain: 'text-mist-700',
    textMuted: 'font-normal text-mist-500',
    textAccent: 'text-mist-600',
    textProminent: 'font-black text-mist-700',
    textHover: 'hover:text-mist-950',
    textSuccess: 'text-green-600',
    textError: 'text-red-600',
    bgProminent: 'bg-mist-100',
    bgMain: 'bg-white/40',
    logo: '/src/assets/ResultadosLogoDark.webp',
  },
  'olive-light': {
    bgApp: 'bg-olive-100',
    bgSurface: 'bg-white',
    bgSurfaceHover: 'hover:bg-olive-100',
    border: 'border-olive-200',
    textMain: 'text-olive-700',
    textMuted: 'font-normal text-olive-500',
    textAccent: 'text-olive-600',
    textProminent: 'font-black text-olive-700',
    textHover: 'hover:text-olive-950',
    textSuccess: 'text-green-600',
    textError: 'text-red-600',
    bgProminent: 'bg-olive-100',
    bgMain: 'bg-white/40',
    logo: '/src/assets/ResultadosLogoDark.webp',
  },
}

interface ThemeState {
  currentTheme: ThemeName
  setTheme: (theme: ThemeName) => void
  lastTournamentId: string | null
  setLastTournamentId: (id: string) => void
}

export const useTheme = create<ThemeState>()(
  persist(
    (set) => ({
      currentTheme: 'stone-dark',
      setTheme: (theme) => set({ currentTheme: theme }),
      lastTournamentId: null,
      setLastTournamentId: (id) => set({ lastTournamentId: id }),
    }),
    {
      name: 'app-theme',
    }
  )
)

export const useThemeClasses = () => {
  const currentTheme = useTheme(state => state.currentTheme)
  // Fallback de seguridad por si el tema guardado en localStorage ya no existe
  return THEMES[currentTheme] || THEMES['zinc-dark']
}

/**
 * ThemeProvider - Componente encargado de sincronizar el tema con el DOM (body)
 */
export default function ThemeProvider({ children }: { children: ReactNode }) {
  const { bgApp, textMain } = useThemeClasses()

  useEffect(() => {
    // Al cambiar de tema, actualizamos el body para que el fondo global sea el del tema
    const classNames = document.body.className.split(' ').filter(c => !c.startsWith('bg-') && !c.startsWith('text-'))
    document.body.className = [...classNames, bgApp, textMain, 'antialiased'].join(' ')
  }, [bgApp, textMain])

  return <>{children}</>
}
