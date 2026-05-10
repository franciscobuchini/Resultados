import { User, Shield, Settings, LogOut, Palette, Globe } from 'lucide-react';
import { Dropdown, DropdownItem, DropdownSection, DropdownDivider } from '../ui/Dropdown';
import { Link } from 'react-router-dom';
import { useTheme } from '../../functions/themeStore';
import type { ThemeName } from '../../functions/themeStore';
import { useTime } from '../../functions/time';
import SyncStatus from './SyncStatus';

const THEME_OPTIONS: { label: string; value: ThemeName }[] = [
  { label: 'Slate', value: 'slate' },
  { label: 'Gray', value: 'gray' },
  { label: 'Zinc', value: 'zinc' },
  { label: 'Neutral', value: 'neutral' },
  { label: 'Stone', value: 'stone' },
  { label: 'Taupe', value: 'taupe' },
  { label: 'Mauve', value: 'mauve' },
  { label: 'Mist', value: 'mist' },
  { label: 'Olive', value: 'olive' },
]

const UTC_OFFSETS = [
  { label: 'USW (UTC-7)', value: -7 },
  { label: 'USE (UTC-4)', value: -4 },
  { label: 'ARG (UTC-3)', value: -3 },
  { label: 'GMT (UTC+0)', value: 0 },
  { label: 'ESP (UTC+1)', value: 1 },
  { label: 'EUR (UTC+2)', value: 2 },
]

export default function UserMenu() {
  const { currentTheme, setTheme } = useTheme();
  const { utcOffset, setUtcOffset } = useTime();

  return (
    <Dropdown 
      align="right" 
      widthClass="w-64"
      icon={User}
      value="Usuario"
    >
      {/* Tema */}
      <DropdownSection 
        icon={Palette} 
        label="Tema" 
        value={<span className="capitalize">{currentTheme}</span>}
      >
        {THEME_OPTIONS.map((opt) => (
          <DropdownItem
            key={opt.value}
            onClick={() => setTheme(opt.value)}
            isActive={currentTheme === opt.value}
          >
            <span>{opt.label}</span>
            {currentTheme === opt.value && (
              <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
            )}
          </DropdownItem>
        ))}
      </DropdownSection>

      {/* Zona Horaria */}
      <DropdownSection 
        icon={Globe} 
        label="Zona" 
        value={UTC_OFFSETS.find(o => o.value === utcOffset)?.label || `UTC${utcOffset >= 0 ? '+' : ''}${utcOffset}`}
      >
        {UTC_OFFSETS.map((opt) => (
          <DropdownItem
            key={opt.value}
            onClick={() => setUtcOffset(opt.value)}
            isActive={utcOffset === opt.value}
          >
            <span>{opt.label}</span>
          </DropdownItem>
        ))}
      </DropdownSection>

      <DropdownDivider />

      {/* Sync Status */}
      <div className="px-4 py-3 flex items-center">
        <SyncStatus />
      </div>

      <DropdownDivider />

      {/* Acciones */}
      <Link to="/admin">
        <DropdownItem onClick={() => {}}>
          <div className="flex items-center gap-3">
            <Shield size={16} />
            <span>Panel Admin</span>
          </div>
        </DropdownItem>
      </Link>
      
      <DropdownItem onClick={() => {}}>
        <div className="flex items-center gap-3">
          <Settings size={16} />
          <span>Ajustes</span>
        </div>
      </DropdownItem>

      <DropdownDivider />

      <DropdownItem onClick={() => {}}>
        <div className="flex items-center gap-3 text-red-400">
          <LogOut size={16} />
          <span>Cerrar Sesión</span>
        </div>
      </DropdownItem>
    </Dropdown>
  );
}
