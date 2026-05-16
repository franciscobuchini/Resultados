const SIZES = {
  'xs': 'w-4 h-4',
  'sm': 'w-6 h-6',
  'md': 'w-10 h-10',
  'lg': 'w-14 h-14',
  'xl': 'w-20 h-20'
} as const;

type SizeKey = keyof typeof SIZES;

interface LogoProps {
  src?: string | null;
  size?: SizeKey | string;
  className?: string;
  alt?: string;
}

import { useThemeClasses } from '../../functions/themeStore';

export default function ImageCrest({ 
  src, 
  size = 'sm', 
  className = '', 
  alt = '' 
}: LogoProps) {
  const { bgSurface } = useThemeClasses();
  
  // Si el size es uno de nuestros tokens, usamos la clase mapeada. 
  // Si no, asumimos que es una clase de Tailwind directa.
  const sizeClass = SIZES[size as SizeKey] || size;

  if (src) {
    return (
      <img 
        src={src} 
        className={`${sizeClass} object-contain flex-shrink-0 ${className}`} 
        alt={alt} 
      />
    );
  }

  return (
    <div className={`${sizeClass} ${bgSurface} rounded-full flex-shrink-0 ${className}`} />
  );
}
