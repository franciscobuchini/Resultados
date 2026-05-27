import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useEffect, type ReactNode } from 'react'
import logoLight from '../assets/ResultadosLogoLight.webp'
import logoDark from '../assets/ResultadosLogoDark.webp'

export type ThemeName =
  | 'zinc-dark' | 'slate-dark' | 'mauve-dark' | 'mist-dark' | 'olive-dark'
  | 'slate-light' | 'taupe-light'

export interface ThemeClasses {
  bgApp: string
  bgSurface: string
  bgSurfaceHover: string
  bgElement?: string
  bgElementHover?: string
  bgMain?: string
  border: string
  borderSubtle?: string
  textMain: string
  textMuted: string
  textDimmed?: string
  textSubtle?: string
  textAccent: string
  textProminent: string
  textHover: string
  textSuccess?: string
  textError?: string
  textInfo?: string
  textAlert?: string
  bgProminent?: string
  logo: string
  goalBg: string
  goalRing: string
  goalTextGradient: string
  goalTextShadow: string
}

export const THEMES: Record<ThemeName, ThemeClasses> = {
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
    textInfo: 'text-blue-400',
    textAlert: 'text-amber-400',
    bgProminent: 'bg-zinc-800/50',
    bgMain: 'bg-black/10',
    logo: logoLight,
    goalBg: 'bg-emerald-500/30',
    goalRing: 'border-emerald-400',
    goalTextGradient: 'from-emerald-200 via-green-400 to-teal-600',
    goalTextShadow: 'drop-shadow-[0_0_20px_rgba(52,211,153,0.9)]',
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
    textInfo: 'text-blue-400',
    textAlert: 'text-amber-400',
    bgProminent: 'bg-slate-800/50',
    bgMain: 'bg-black/10',
    logo: logoLight,
    goalBg: 'bg-sky-500/30',
    goalRing: 'border-sky-400',
    goalTextGradient: 'from-sky-200 via-blue-400 to-indigo-600',
    goalTextShadow: 'drop-shadow-[0_0_20px_rgba(56,189,248,0.9)]',
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
    textInfo: 'text-blue-400',
    textAlert: 'text-amber-400',
    bgProminent: 'bg-mauve-800/50',
    bgMain: 'bg-black/10',
    logo: logoLight,
    goalBg: 'bg-violet-500/30',
    goalRing: 'border-violet-400',
    goalTextGradient: 'from-fuchsia-200 via-violet-400 to-purple-600',
    goalTextShadow: 'drop-shadow-[0_0_20px_rgba(167,139,250,0.9)]',
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
    textInfo: 'text-blue-400',
    textAlert: 'text-amber-400',
    bgProminent: 'bg-mist-800/50',
    bgMain: 'bg-black/10',
    logo: logoLight,
    goalBg: 'bg-cyan-500/30',
    goalRing: 'border-cyan-400',
    goalTextGradient: 'from-cyan-200 via-cyan-400 to-blue-600',
    goalTextShadow: 'drop-shadow-[0_0_20px_rgba(34,211,238,0.9)]',
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
    textInfo: 'text-blue-400',
    textAlert: 'text-amber-400',
    bgProminent: 'bg-olive-800/50',
    bgMain: 'bg-black/10',
    logo: logoLight,
    goalBg: 'bg-lime-500/30',
    goalRing: 'border-lime-400',
    goalTextGradient: 'from-yellow-200 via-lime-400 to-green-600',
    goalTextShadow: 'drop-shadow-[0_0_20px_rgba(163,230,53,0.9)]',
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
    textInfo: 'text-blue-600',
    textAlert: 'text-amber-600',
    bgProminent: 'bg-slate-100',
    bgMain: 'bg-white/40',
    logo: logoDark,
    goalBg: 'bg-blue-500/20',
    goalRing: 'border-blue-500',
    goalTextGradient: 'from-sky-500 via-blue-600 to-indigo-700',
    goalTextShadow: 'drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]',
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
    textInfo: 'text-blue-600',
    textAlert: 'text-amber-600',
    bgProminent: 'bg-taupe-100',
    bgMain: 'bg-white/40',
    logo: logoDark,
    goalBg: 'bg-amber-500/20',
    goalRing: 'border-amber-500',
    goalTextGradient: 'from-yellow-500 via-amber-600 to-orange-700',
    goalTextShadow: 'drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]',
  },
}

interface ThemeState {
  currentTheme: ThemeName
  setTheme: (theme: ThemeName) => void
  lastTournamentId: string | null
  setLastTournamentId: (id: string) => void
  showApiIds: boolean
  setShowApiIds: (show: boolean) => void
}

export const useTheme = create<ThemeState>()(
  persist(
    (set) => ({
      currentTheme: 'slate-dark',
      setTheme: (theme) => set({ currentTheme: theme }),
      lastTournamentId: null,
      setLastTournamentId: (id) => set({ lastTournamentId: id }),
      showApiIds: false,
      setShowApiIds: (show) => set({ showApiIds: show }),
    }),
    {
      name: 'app-theme',
    }
  )
)

export const useThemeClasses = () => {
  const currentTheme = useTheme(state => state.currentTheme)
  return THEMES[currentTheme] || THEMES['zinc-dark']
}

export default function ThemeProvider({ children }: { children: ReactNode }) {
  const { bgApp, textMain } = useThemeClasses()

  useEffect(() => {
    const classNames = document.body.className
      .split(' ')
      .filter(c => !c.startsWith('bg-') && !c.startsWith('text-'))
    document.body.className = [...classNames, bgApp, textMain, 'antialiased'].join(' ')
  }, [bgApp, textMain])

  return <>{children}</>
}