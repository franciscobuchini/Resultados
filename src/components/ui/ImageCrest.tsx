interface LogoProps {
  src?: string | null;
  size?: string; // e.g., 'w-6 h-6'
  className?: string;
  alt?: string;
}

import { useThemeClasses } from '../../functions/themeStore';

export default function ImageCrest({ 
  src, 
  size = 'w-6 h-6', 
  className = '', 
  alt = '' 
}: LogoProps) {
  const { bgSurface } = useThemeClasses();
  if (src) {
    return (
      <img 
        src={src} 
        className={`${size} object-contain flex-shrink-0 ${className}`} 
        alt={alt} 
      />
    );
  }

  return (
    <div className={`${size} ${bgSurface} rounded-full flex-shrink-0 ${className}`} />
  );
}
