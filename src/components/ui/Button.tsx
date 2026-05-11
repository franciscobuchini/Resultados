import { type ReactNode, type ElementType } from 'react';
import { useThemeClasses } from '../../functions/themeStore';

interface ButtonProps {
  icon?: ElementType;
  label?: string;
  value?: ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: 'outline' | 'danger';
  disabled?: boolean;
}

export function Button({ 
  icon: Icon, 
  label, 
  value, 
  onClick, 
  className = '', 
  variant = 'outline',
  disabled = false
}: ButtonProps) {
  const { bgSurfaceHover, border, textMuted, textMain, textError } = useThemeClasses();

  const isDanger = variant === 'danger';
  
  const baseStyles = 'flex items-center gap-2 transition-all';
  const stateStyles = disabled ? 'opacity-50 cursor-not-allowed grayscale' : 'cursor-pointer active:scale-95';
  
  let variantStyles = '';
  if (isDanger) {
    variantStyles = `px-2 py-1 ${textError} hover:underline border-none bg-transparent h-auto`;
  } else {
    // outline es el default
    variantStyles = `rounded-xl border ${border} ${bgSurfaceHover} px-3 py-1.5 ${textMain}`;
  }

  return (
    <button
      onClick={!disabled ? onClick : undefined}
      disabled={disabled}
      className={`${baseStyles} ${stateStyles} ${variantStyles} h-10 ${className}`}
    >
      {Icon && <Icon size={16} className={isDanger ? textError : textMuted} />}
      {label && <span className="text-sm hidden sm:inline">{label}</span>}
      {value && <span className="text-sm font-medium">{value}</span>}
    </button>
  );
}
