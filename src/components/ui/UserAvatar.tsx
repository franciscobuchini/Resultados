import { User } from 'lucide-react';
import { useThemeClasses } from '../../functions/themeStore';

interface UserAvatarProps {
  /** URL del escudo del equipo del usuario */
  crestUrl?: string | null;
  /** URL de la bandera del país del usuario */
  flagUrl?: string | null;
  /** Tamaño total del avatar (ej: 'w-12 h-12') */
  size?: string;
  /** Tamaño del escudo (ej: 'w-10 h-10') */
  crestSize?: string;
  /** Clase adicional para el contenedor */
  className?: string;
}

/**
 * UserAvatar - Componente que muestra el escudo del equipo del usuario
 * con la bandera de su país en la esquina inferior derecha.
 */
export default function UserAvatar({ 
  crestUrl, 
  flagUrl, 
  size = 'w-12 h-12', 
  crestSize = 'w-10 h-10',
  className = '' 
}: UserAvatarProps) {
  const { border, bgMain } = useThemeClasses();

  return (
    <div className={`relative shrink-0 ${size} ${className} rounded-2xl border ${border} ${bgMain}`}>
      {/* Contenedor del Escudo */}
      <div className="w-full h-full flex items-center justify-center overflow-hidden">
        {crestUrl ? (
          <img src={crestUrl} className={`${crestSize} object-contain`} alt="" />
        ) : (
          <User size={24} />
        )}
      </div>

      {/* Bandera (dentro del recuadro, esquina inferior derecha) */}
      {flagUrl && (
        <div className="absolute bottom-1 right-1 w-[30%] h-auto">
          <img src={flagUrl} className="w-full h-auto object-contain" alt="" />
        </div>
      )}
    </div>
  );
}
