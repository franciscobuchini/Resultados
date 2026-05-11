import { User, Shield, Settings, LogOut } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Dropdown, DropdownItem, DropdownOption } from '../ui/Dropdown'
import SyncStatus from './SyncStatus'
import { ThemeSectionMenu } from './ThemeSelector'
import { UtcSectionMenu } from './UtcSelector'

export default function UserMenu() {
  return (
    <Dropdown
      align="right"
      widthClass="w-64"
      icon={User}
      value="Usuario"
    >
      {/* Info: estado de sincronización */}
      <DropdownOption>
        <SyncStatus />
      </DropdownOption>

      {/* Preferencias */}
      <ThemeSectionMenu />
      <UtcSectionMenu />

      {/* Navegación */}
      <Link to="/profile">
        <DropdownItem onClick={() => {}} icon={User} label="Editar Perfil" />
      </Link>
      <Link to="/admin">
        <DropdownItem onClick={() => {}} icon={Shield} label="Panel Admin" />
      </Link>
      <DropdownItem onClick={() => {}} icon={Settings} label="Ajustes" />

      {/* Sesión */}
      <DropdownItem
        onClick={() => {}}
        icon={LogOut}
        label="Cerrar Sesión"
      />
    </Dropdown>
  )
}
