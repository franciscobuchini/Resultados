import { useState, createContext, useContext, type ReactNode, type ElementType } from 'react';
import { useThemeClasses } from '../../functions/themeStore';
import { ChevronRight } from 'lucide-react';

// Contexto para coordinar qué sección lateral está abierta
interface DropdownContextType {
  activeSection: string | null;
  setActiveSection: (id: string | null) => void;
}

const DropdownContext = createContext<DropdownContextType | null>(null);

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
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const { bgSurface, bgSurfaceHover, border, textMuted, textMain } = useThemeClasses();

  // Resetear sección activa al cerrar el dropdown principal
  const toggleDropdown = () => {
    if (isOpen) setActiveSection(null);
    setIsOpen(!isOpen);
  };

  return (
    <DropdownContext.Provider value={{ activeSection, setActiveSection }}>
      <div className="relative inline-block text-left">
        <button
          onClick={toggleDropdown}
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
              className={`absolute top-full mt-2 z-50 flex flex-col rounded-xl border ${align === 'left' ? 'left-0' : 'right-0'} ${widthClass} ${bgSurface} ${border}`}
            >
              {children}
            </div>
          </>
        )}
      </div>
    </DropdownContext.Provider>
  );
}

interface DropdownItemProps {
  onClick: () => void;
  isActive?: boolean;
  children: ReactNode;
}

export function DropdownItem({ onClick, isActive, children }: DropdownItemProps) {
  const { bgSurfaceHover, textMuted, textMain } = useThemeClasses();
  return (
    <button
      onClick={onClick}
      className={`w-full px-4 py-3 text-left text-xs flex items-center justify-between ${bgSurfaceHover} ${
        isActive ? `${textMain} font-bold` : textMuted
      }`}
    >
      {children}
    </button>
  );
}

interface DropdownSectionProps {
  icon?: ElementType;
  label: string;
  value: ReactNode;
  children: ReactNode;
}

export function DropdownSection({ icon: Icon, label, value, children }: DropdownSectionProps) {
  const context = useContext(DropdownContext);
  const { bgSurface, bgSurfaceHover, border, textMuted, textMain } = useThemeClasses();

  if (!context) {
    throw new Error('DropdownSection debe usarse dentro de un componente Dropdown');
  }

  const isOpen = context.activeSection === label;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    context.setActiveSection(isOpen ? null : label);
  };

  return (
    <div className="relative">
      <button
        onClick={handleToggle}
        className={`w-full px-4 py-3 text-left text-xs flex items-center justify-between ${bgSurfaceHover} ${isOpen ? textMain : ''}`}
      >
        <div className="flex items-center gap-2">
          {Icon && <Icon size={14} className={textMuted} />}
          <span className={textMuted}>{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`font-bold ${textMain}`}>{value}</span>
          <ChevronRight 
            size={12} 
            className={`${textMuted} transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
          />
        </div>
      </button>

      {/* Panel flotante lateral */}
      {isOpen && (
        <div 
          className={`absolute top-0 right-full mr-2 z-50 flex flex-col overflow-hidden rounded-xl border w-36 overflow-y-auto ${bgSurface} ${border}`}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export function DropdownDivider() {
  return <div className="h-1 opacity-20" />;
}
