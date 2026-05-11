import { useState, createContext, useContext, type ReactNode, type ElementType } from 'react';
import { useThemeClasses } from '../../functions/themeStore';
import { ChevronRight } from 'lucide-react';

import { Button } from './Button';

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

export function Dropdown({ icon, label, value, children, align = 'right', widthClass = 'w-48' }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const { bgSurface, border } = useThemeClasses();

  // Resetear sección activa al cerrar el dropdown principal
  const toggleDropdown = () => {
    if (isOpen) setActiveSection(null);
    setIsOpen(!isOpen);
  };

  return (
    <DropdownContext.Provider value={{ activeSection, setActiveSection }}>
      <div className="relative inline-block text-left">
        <Button
          onClick={toggleDropdown}
          icon={icon}
          label={label}
          value={value}
        />

        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <div 
              className={`absolute top-full mt-2 z-50 flex flex-col rounded-xl border ${align === 'left' ? 'left-0' : 'right-0'} ${widthClass} ${bgSurface} ${border} overflow-hidden`}
            >
              {children}
            </div>
          </>
        )}
      </div>
    </DropdownContext.Provider>
  );
}

interface DropdownOptionProps {
  icon?: ElementType;
  label?: ReactNode;
  value?: ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  children?: ReactNode;
  isActive?: boolean;
  className?: string;
  rightElement?: ReactNode;
}

export function DropdownOption({ 
  icon: Icon, 
  label, 
  value, 
  onClick, 
  children, 
  isActive, 
  className = '',
  rightElement
}: DropdownOptionProps) {
  const { bgSurfaceHover, textMuted, textMain } = useThemeClasses();
  
  const Tag = onClick ? 'button' : 'div';
  
  return (
    <Tag
      onClick={onClick}
      className={`w-full px-4 py-3 text-left text-sm flex items-center justify-between transition-colors ${onClick ? bgSurfaceHover : ''} ${
        isActive ? `${textMain} font-medium` : textMuted
      } ${className}`}
    >
      {children ? children : (
        <>
          <div className="flex items-center gap-2">
            {Icon && <Icon size={16} className={textMuted} />}
            {label && <span className={textMuted}>{label}</span>}
          </div>
          <div className="flex items-center gap-2">
            {value && <span className={`${textMain} font-medium`}>{value}</span>}
            {rightElement}
          </div>
        </>
      )}
    </Tag>
  );
}

interface DropdownItemProps {
  onClick: () => void;
  isActive?: boolean;
  children?: ReactNode;
  icon?: ElementType;
  label?: ReactNode;
  value?: ReactNode;
  rightElement?: ReactNode;
  className?: string;
}

export function DropdownItem({ 
  onClick, 
  isActive, 
  children, 
  icon, 
  label, 
  value, 
  rightElement, 
  className 
}: DropdownItemProps) {
  return (
    <DropdownOption 
      onClick={onClick} 
      isActive={isActive} 
      icon={icon} 
      label={label} 
      value={value}
      rightElement={rightElement}
      className={className}
    >
      {children}
    </DropdownOption>
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
  const { bgSurface, border, textMuted } = useThemeClasses();

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
      <DropdownOption
        onClick={handleToggle}
        icon={Icon}
        label={label}
        value={value}
        isActive={isOpen}
        rightElement={
          <ChevronRight 
            size={12} 
            className={`${textMuted} transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
          />
        }
      />

      {/* Panel flotante lateral */}
      {isOpen && (
        <div 
          className={`absolute top-0 right-full mr-2 z-50 flex flex-col overflow-hidden rounded-xl border w-36 overflow-hidden ${bgSurface} ${border}`}
        >
          {children}
        </div>
      )}
    </div>
  );
}

