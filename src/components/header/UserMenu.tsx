import { User, Shield, LogOut, LogIn } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Dropdown, DropdownItem, DropdownOption } from '../ui/Dropdown'
import SyncStatus from './SyncStatus'
import { ThemeSectionMenu } from './ThemeSelector'
import { UtcSectionMenu } from './UtcSelector'
import { useAuth } from '../../functions/auth'

export default function UserMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <Dropdown
      align="right"
      widthClass="w-64"
      icon={User}
      value={user ? user.user_name : 'Invitado'}
    >
      {/* Info: estado de sincronización */}
      <DropdownOption className="rounded-t-xl">
        <SyncStatus />
      </DropdownOption>

      {/* Preferencias */}
      <ThemeSectionMenu />
      <UtcSectionMenu />

      {/* Navegación */}
      {user ? (
        <>
          <Link to="/profile">
            <DropdownItem onClick={() => {}} icon={User} label="Editar Perfil" />
          </Link>
          <Link to="/admin">
            <DropdownItem onClick={() => {}} icon={Shield} label="Panel Admin" />
          </Link>
          {/* Sesión */}
          <DropdownItem
            onClick={handleLogout}
            icon={LogOut}
            label="Cerrar Sesión"
            className="rounded-b-xl"
          />
        </>
      ) : (
        <Link to="/login">
          <DropdownItem
            onClick={() => {}}
            icon={LogIn}
            label="Iniciar Sesión"
            className="rounded-b-xl"
          />
        </Link>
      )}
    </Dropdown>
  )
}
