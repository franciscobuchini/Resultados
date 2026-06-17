import { type ReactNode, type ElementType } from 'react';
import { useThemeClasses } from '../../functions/themeStore';

export type ButtonVariant = 'outline' | 'danger' | 'dangerOutline' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  icon?: ElementType;
  label?: string;
  value?: ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  href?: string;
  target?: string;
  rel?: string;
  title?: string;
  hideLabelOnMobile?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export function Button({ 
  icon: Icon, 
  label, 
  value, 
  onClick, 
  className = '', 
  variant = 'outline',
  size = 'md',
  disabled = false,
  href,
  target,
  rel,
  title,
  hideLabelOnMobile = false,
  type = 'button'
}: ButtonProps) {
  const theme = useThemeClasses();

  if (disabled) return null;

  // 1. Estilos estructurales base (con clase 'group' para micro-animaciones e iconos reactivos)
  const baseStyles = 'flex items-center justify-center gap-2 transition-all font-medium group';
  
  // 2. Estilos basados en el estado (interactivo o inactivo)
  const stateStyles = disabled 
    ? 'opacity-50 cursor-not-allowed grayscale' 
    : 'cursor-pointer active:scale-95';

  // 3. Diccionario de Variantes (outline, danger y el nuevo ghost sin bordes ni fondo)
  const variantStylesMap: Record<ButtonVariant, string | undefined> = {
    outline: `rounded-xl border ${theme.border} ${theme.bgSurfaceHover} ${theme.textMain} hover:opacity-90`,
    danger: `${theme.textError} hover:underline border-none bg-transparent`,
    dangerOutline: `${theme.textError} hover:underline border ${theme.border} ${theme.bgSurfaceHover} ${theme.textMain} hover:opacity-90`,
    ghost: `border-none bg-transparent ${theme.textMuted} ${theme.textHover} hover:bg-transparent`,
  };

  // 4. Diccionario de Tamaños (Controla paddings, alto y redondeo según el tipo de botón)
  const isDanger = variant === 'danger';
  const isGhost = variant === 'ghost';
  const sizeStylesMap: Record<ButtonSize, string | undefined> = {
    sm: isDanger ? 'px-1 py-0.5 text-xs' : isGhost ? 'px-1 py-0.5 text-xs' : 'px-2.5 py-1.5 text-xs rounded-lg h-8',
    md: isDanger ? 'px-2 py-1 text-sm' : isGhost ? 'px-2 py-1 text-sm' : 'px-3.5 py-1.5 text-sm rounded-xl h-10',
    lg: isDanger ? 'px-3 py-2 text-base' : isGhost ? 'px-3 py-1.5 text-base' : 'px-5 py-2.5 text-base rounded-2xl h-12',
  };

  // 5. Diccionario de colores y efectos de Iconos por variante
  const iconColorMap: Record<ButtonVariant, string | undefined> = {
    outline: theme.textMuted,
    danger: theme.textError,
    dangerOutline: theme.textError,
    ghost: 'opacity-70 group-hover:opacity-100 transition-opacity',
  };

  // Resoluciones de configuración
  const variantClasses = variantStylesMap[variant] || variantStylesMap.outline || '';
  const sizeClasses = sizeStylesMap[size] || sizeStylesMap.md || '';
  const iconColorClass = iconColorMap[variant] || iconColorMap.outline || '';
  
  // Altura base condicional (la variante 'danger' y 'ghost' son inline/sin alto fijo)
  const heightClass = (isDanger || isGhost) ? 'h-auto' : '';

  // Botón solo con icono → forzar aspecto cuadrado
  const isIconOnly = !!Icon && !label && !value;
  const iconOnlyClass = isIconOnly ? 'aspect-square !px-0' : '';

  // Dimensiones del icono según el tamaño del botón
  const iconSizes: Record<ButtonSize, number> = {
    sm: 14,
    md: 16,
    lg: 18,
  };
  const iconSize = iconSizes[size] || 16;

  const Tag = href ? 'a' : 'button';

  return (
    <Tag
      {...(href ? {} : { type })}
      href={href}
      target={target}
      rel={rel}
      title={title}
      onClick={!disabled ? onClick : undefined}
      className={`${baseStyles} ${stateStyles} ${variantClasses} ${sizeClasses} ${heightClass} ${iconOnlyClass} ${className}`}
      {...(href ? {} : { disabled })} // solo pasar disabled nativo si es <button>
    >
      {Icon && <Icon size={iconSize} className={`${iconColorClass} shrink-0`} />}
      {label && <span className={hideLabelOnMobile ? 'hidden sm:inline' : ''}>{label}</span>}
      {value && <span>{value}</span>}
    </Tag>
  );
}
