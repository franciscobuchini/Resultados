import { useState } from 'react'
import { useTime } from '../contexts/TimeContext'

const OFFSETS = [
  { label: 'USW (UTC-7)', value: -7 },
  { label: 'USE (UTC-5)', value: -5 },
  { label: 'UTC-3 (ARG)', value: -3 },
  { label: 'UTC+0 (GMT)', value: 0 },
  { label: 'UTC+1 (ESP)', value: 1 },
  { label: 'UTC+2 (EUR)', value: 2 },
]

export default function UtcSelector() {
  const { utcOffset: currentOffset, setUtcOffset: onOffsetChange } = useTime()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-zinc-900 border border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800 px-3 sm:px-4 h-8 sm:h-10 rounded-full flex items-center gap-2 transition-all shadow-2xl cursor-pointer font-mono"
      >
        <span className="text-[10px] sm:text-xs text-zinc-400 hidden sm:inline">Zona:</span>
        <span className="text-[10px] sm:text-xs text-white font-bold">
          {OFFSETS.find(o => o.value === currentOffset)?.label || `UTC${currentOffset >= 0 ? '+' : ''}${currentOffset}`}
        </span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 bottom-full mb-2 w-40 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl z-50 overflow-hidden max-h-[60vh] overflow-y-auto">
            {OFFSETS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  onOffsetChange(opt.value)
                  setIsOpen(false)
                }}
                className={`w-full px-4 py-2 text-left text-xs hover:bg-zinc-800 transition-colors ${
                  currentOffset === opt.value ? 'text-green-400 font-bold' : 'text-zinc-400'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
