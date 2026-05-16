import { useTheme, useThemeClasses } from '../../functions/themeStore';
import DataBox from '../ui/DataBox';
import { DataRowHeader, BASE, HEIGHT } from '../ui/DataRow';
import { Settings2, Eye, EyeOff } from 'lucide-react';

/**
 * ControlPanel - Componente administrativo para configuraciones locales.
 * Permite alternar visibilidad de datos sensibles (IDs de API, etc.)
 */
export default function ControlPanel() {
  const { showApiIds, setShowApiIds } = useTheme();
  const { 
    textMuted, 
    bgSurfaceHover, 
    border, 
    bgApp 
  } = useThemeClasses();

  return (
    <div className="flex flex-col gap-4">
      <DataBox>
        {/* Cabecera del Panel */}
        <DataRowHeader>
          <div className="flex items-center gap-2">
            <Settings2 size={18} className={textMuted} />
            <span className="font-bold uppercase tracking-wider text-xs">Configuración Privada</span>
          </div>
        </DataRowHeader>

        {/* Opción: Mostrar IDs de API */}
        <div 
          onClick={() => setShowApiIds(!showApiIds)}
          className={`
            ${BASE} ${HEIGHT} ${bgApp} ${border} ${bgSurfaceHover}
            cursor-pointer transition-all flex justify-between group
          `}
        >
          <div className="flex items-center gap-3">
            <div className={`p-1.5 rounded-md ${showApiIds ? 'bg-green-500/10 text-green-500' : 'bg-zinc-500/10 text-zinc-500'}`}>
              {showApiIds ? <Eye size={16} /> : <EyeOff size={16} />}
            </div>
            <div className="flex flex-col">
              <span className="font-medium">IDs de DR / Sportsmonks</span>
              <span className="text-[10px] opacity-50">Mostrar identificadores de API en tablas</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className={`
              relative w-8 h-4 rounded-full transition-colors duration-200
              ${showApiIds ? 'bg-green-500' : 'bg-zinc-700'}
            `}>
              <div className={`
                absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform duration-200
                ${showApiIds ? 'translate-x-4' : 'translate-x-0'}
              `} />
            </div>
          </div>
        </div>

        {/* Footer Informativo */}
        <div className={`p-3 text-[10px] ${textMuted} italic bg-black/5 border-t ${border}`}>
          * Estos ajustes son locales de este navegador y no afectan lo que ven otros usuarios.
        </div>
      </DataBox>
    </div>
  );
}
