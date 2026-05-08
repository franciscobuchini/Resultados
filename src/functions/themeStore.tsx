import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useEffect, type ReactNode } from 'react'

export type ThemeName = 'zinc' | 'stone' | 'slate' | 'neutral' | 'gray' | 'taupe' | 'mauve' | 'mist' | 'olive'

export interface ThemeClasses {
  // Backgrounds
  bgApp: string
  bgSurface: string
  bgSurfaceHover: string
  bgElement?: string
  bgElementHover?: string

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
  bgProminent?: string
}

export const THEMES: Record<ThemeName, ThemeClasses> = {
  // Tema clásico oscuro y frío
  zinc: {
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
    bgProminent: 'bg-zinc-800/50',
  },
  // Tema premium amarronado/taupe
  stone: {
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
    bgProminent: 'bg-stone-800/50',
  },
  // Tema azulado oscuro
  slate: {
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
    bgProminent: 'bg-slate-800/50',
  },
  // Tema negro profundo
  neutral: {
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
    bgProminent: 'bg-neutral-800/50',
  },
  // Tema gris neutro
  gray: {
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
    bgProminent: 'bg-gray-800/50',
  },
  // Tema Taupe (Cálido)
  taupe: {
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
    bgProminent: 'bg-taupe-800/50',
  },
  // Tema Mauve (Violáceo)
  mauve: {
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
    bgProminent: 'bg-mauve-800/50',
  },
  // Tema Mist (Azul Hielo)
  mist: {
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
    bgProminent: 'bg-mist-800/50',
  },
  // Tema Olive (Verdoso)
  olive: {
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
    bgProminent: 'bg-olive-800/50',
  }
}

interface ThemeState {
  currentTheme: ThemeName
  setTheme: (theme: ThemeName) => void
}

export const useTheme = create<ThemeState>()(
  persist(
    (set) => ({
      currentTheme: 'stone', 
      setTheme: (theme) => set({ currentTheme: theme }),
    }),
    {
      name: 'app-theme',
    }
  )
)

export const useThemeClasses = () => {
  const currentTheme = useTheme(state => state.currentTheme)
  return THEMES[currentTheme]
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
