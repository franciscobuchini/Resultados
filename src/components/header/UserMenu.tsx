import { useEffect, useState, type ElementType } from 'react'
import { User, Shield, LogOut, LogIn } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Dropdown, DropdownItem, DropdownOption } from '../ui/Dropdown'
import SyncStatus from './SyncStatus'
import { ThemeSectionMenu } from './ThemeSelector'
import { UtcSectionMenu } from './UtcSelector'
import { useAuth } from '../../functions/auth'
import { supabase } from '../../functions/supabase'
 
export default function UserMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [teamCrestUrl, setTeamCrestUrl] = useState<string | null>(null);
 
  useEffect(() => {
    const fetchTeamCrest = async () => {
      if (!user?.user_team_id) {
        setTeamCrestUrl(null);
        return;
      }
      const { data } = await supabase
        .from('teams')
        .select('team_crest_url')
        .eq('team_id', user.user_team_id)
        .single();
      setTeamCrestUrl(data?.team_crest_url ?? null);
    };
    fetchTeamCrest();
  }, [user?.user_team_id]);
 
  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      navigate('/');
    }
  };
 
  const TriggerIcon: ElementType = teamCrestUrl
    ? () => <img src={teamCrestUrl} className="w-5 h-5 object-contain" alt="" />
    : User;
 
  return (
    <Dropdown
      align="right"
      widthClass="w-64"
      icon={TriggerIcon}
      value={user ? `@${user.user_name.replace(/^@+/, '')}` : 'Iniciar Sesión'}
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
            <DropdownItem onClick={() => { }} icon={User} label="Editar Perfil" />
          </Link>
          {user.user_plan === 'admin' && (
            <Link to="/admin">
              <DropdownItem onClick={() => { }} icon={Shield} label="Panel Admin" />
            </Link>
          )}
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
            onClick={() => { }}
            icon={LogIn}
            label="Iniciar Sesión"
            className="rounded-b-xl"
          />
        </Link>
      )}
    </Dropdown>
  )
}