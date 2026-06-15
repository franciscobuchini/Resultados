import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useThemeClasses } from '../../functions/themeStore'

interface DateNavigatorProps {
  dateLabel: string
  onChangeDate: (offset: number) => void
  canGoBack?: boolean
}

export default function DateNavigator({ dateLabel, onChangeDate, canGoBack = true }: DateNavigatorProps) {
  const { textMain, textMuted, bgSurfaceHover } = useThemeClasses()
  
  return (
    <div className="flex items-center justify-center gap-4 mb-6">
      <button
        onClick={() => canGoBack && onChangeDate(-1)}
        className={`p-2 rounded-full ${bgSurfaceHover} transition-colors ${canGoBack ? textMuted : 'opacity-20 cursor-not-allowed'}`}
        title="Anterior"
        disabled={!canGoBack}
      >
        <ChevronLeft size={20} strokeWidth={2.5} />
      </button>
      <span className={`text-base font-semibold capitalize ${textMain} w-44 sm:w-56 text-center`}>
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
