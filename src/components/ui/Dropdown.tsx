import { useState, type ReactNode, type ElementType } from 'react';
import { useThemeClasses } from '../../functions/themeStore';

interface DropdownProps {
  icon?: ElementType;
  label?: string;
  value: ReactNode;
  children: ReactNode;
  align?: 'left' | 'right';
  widthClass?: string;
}

export function Dropdown({ icon: Icon, label, value, children, align = 'right', widthClass = 'w-48' }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { bgSurface, bgSurfaceHover, border, textMuted, textMain } = useThemeClasses();

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 h-8 rounded-full border font-mono ${bgSurface} ${border} ${bgSurfaceHover}`}
      >
        {Icon && <Icon size={14} className={textMuted} />}
        {label && <span className={`text-xs ${textMuted} hidden sm:inline`}>{label}</span>}
        <span className={`text-xs font-bold ${textMain}`}>{value}</span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div 
            onClick={() => setIsOpen(false)}
            className={`absolute top-full mt-2 z-50 flex flex-col overflow-hidden rounded-xl border ${align === 'left' ? 'left-0' : 'right-0'} ${widthClass} ${bgSurface} ${border}`}
          >
            {children}
          </div>
        </>
      )}
    </div>
  );
}

interface DropdownItemProps {
  onClick: () => void;
  isActive?: boolean;
  children: ReactNode;
}

export function DropdownItem({ onClick, isActive, children }: DropdownItemProps) {
  const { bgSurfaceHover, textMuted, textSuccess } = useThemeClasses();
  return (
    <button
      onClick={onClick}
      className={`w-full px-4 py-3 text-left text-xs flex items-center justify-between ${bgSurfaceHover} ${
        isActive ? `${textSuccess} font-bold` : textMuted
      }`}
    >
      {children}
    </button>
  );
}
