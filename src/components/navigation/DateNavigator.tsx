import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useThemeClasses } from '../../functions/themeStore'

interface DateNavigatorProps {
  dateLabel: string
  onChangeDate: (offset: number) => void
}

export default function DateNavigator({ dateLabel, onChangeDate }: DateNavigatorProps) {
  const { textMain, textMuted, bgSurfaceHover } = useThemeClasses()
  
  return (
    <div className="flex items-center justify-center gap-4 mb-6">
      <button
        onClick={() => onChangeDate(-1)}
        className={`p-2 rounded-full ${bgSurfaceHover} transition-colors ${textMuted}`}
        title="Anterior"
      >
        <ChevronLeft size={20} strokeWidth={2.5} />
      </button>
      <span className={`text-base font-semibold capitalize ${textMain}`}>
        {dateLabel}
      </span>
      <button
        onClick={() => onChangeDate(1)}
        className={`p-2 rounded-full ${bgSurfaceHover} transition-colors ${textMuted}`}
        title="Siguiente"
      >
        <ChevronRight size={20} strokeWidth={2.5} />
      </button>
    </div>
  )
}
