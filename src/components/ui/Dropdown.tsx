import React, { useState, createContext, useContext, useRef, useEffect, type ReactNode, type ElementType } from 'react';
import { useThemeClasses } from '../../functions/themeStore';
import { ChevronRight } from 'lucide-react';

import { Button } from './Button';

// Contexto para coordinar qué sección lateral está abierta
interface DropdownContextType {
  activeSection: string | null;
  setActiveSection: (id: string | null) => void;
  close: () => void;
}

const DropdownContext = createContext<DropdownContextType | null>(null);

/**
 * Función de utilidad para aplicar redondeo inferior al último elemento de una lista de hijos.
 * Esto asegura que el efecto hover del último item no tape las esquinas redondeadas del contenedor.
 */
const applyDropdownRounding = (children: ReactNode) => {
  const childrenArray = React.Children.toArray(children);
  return childrenArray.map((child, index) => {
    if (index === childrenArray.length - 1 && React.isValidElement(child)) {
      return React.cloneElement(child, {
        className: `${(child.props as any).className || ''} rounded-b-xl`.trim(),
      } as any);
    }
    return child;
  });
};

interface DropdownProps {
  icon?: ElementType;
  label?: string;
  value: ReactNode;
  children: ReactNode;
  align?: 'left' | 'right';
  widthClass?: string;
  variant?: 'outline' | 'danger';
}

export function Dropdown({
  icon,
  label,
  value,
  children,
  align = 'right',
  widthClass = 'min-w-max',
  variant = 'outline',
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const { bgSurface, border } = useThemeClasses();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Manejar click fuera para cerrar (Función Global)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setActiveSection(null);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Resetear sección activa al cerrar el dropdown principal
  const toggleDropdown = () => {
    if (isOpen) setActiveSection(null);
    setIsOpen(!isOpen);
  };

  const closeDropdown = () => {
    setIsOpen(false);
    setActiveSection(null);
  };

  return (
    <DropdownContext.Provider value={{ activeSection, setActiveSection, close: closeDropdown }}>
      <div
        ref={dropdownRef}
        className="relative inline-block text-left"
      >
        <Button
          onClick={toggleDropdown}
          icon={icon}
          label={label}
          value={value}
          variant={variant}
        />

        {isOpen && (
          <div
            className={`absolute top-full z-50 pt-2 ${align === 'left' ? 'left-0' : 'right-0'} ${widthClass} max-sm:fixed max-sm:left-4 max-sm:right-4 max-sm:w-auto max-sm:top-20 animate-in fade-in zoom-in-95 duration-200`}
          >
            <div className={`flex flex-col rounded-xl border ${bgSurface} ${border} shadow-2xl`}>
              {applyDropdownRounding(children)}
            </div>
          </div>
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
      className={`w-full px-4 py-3 text-left text-sm flex items-center justify-between gap-4 transition-colors whitespace-nowrap ${onClick ? bgSurfaceHover : ''} ${isActive ? `${textMain} font-medium` : textMuted
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
  const context = useContext(DropdownContext);

  const handleClick = () => {
    onClick();
    context?.close();
  };

  return (
    <DropdownOption
      onClick={handleClick}
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

      {/* Panel flotante lateral (Desktop) o Acordeón (Mobile) */}
      {isOpen && (
        <div
          className={`sm:absolute sm:top-0 sm:right-full sm:pr-2 z-50 flex flex-col max-sm:relative max-sm:w-full max-sm:mt-1 max-sm:mb-2 max-sm:border-x-0 max-sm:rounded-none animate-in slide-in-from-top-1 duration-200`}
        >
          <div className={`flex flex-col rounded-xl border sm:min-w-max overflow-hidden ${bgSurface} ${border} shadow-xl`}>
            {applyDropdownRounding(children)}
          </div>
        </div>
      )}
    </div>
  );
}

