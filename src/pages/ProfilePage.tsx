import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Globe, ShieldQuestion, User } from 'lucide-react';
import PageBanner from '../layout/PageBanner';
import PageContent from '../layout/PageContent';
import { useThemeClasses } from '../functions/themeStore';
import { DropdownOption } from '../components/ui/Dropdown';
import { PlanBadge } from '../components/ui/Badge';
import { supabase } from '../functions/supabase';
import UserAvatar from '../components/ui/UserAvatar';
import { Button } from '../components/ui/Button';
import { Save } from 'lucide-react';
import { useAuth } from '../functions/auth';
import { Input } from '../components/ui/Input';

interface Team {
  team_id: string;
  team_name: string;
  team_fullname: string | null;
  team_crest_url: string | null;
  team_country_id: string | null;
}

interface Country {
  country_id: string;
  country_name: string;
  country_flag_url: string | null;
}

export default function ProfilePage() {
  const { border, textMain, textMuted, bgSurface, bgSurfaceHover } = useThemeClasses();
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();

  // Si no está logueado, redirigir al login
  useEffect(() => {
    if (!user) navigate('/login');
  }, [user, navigate]);

  const [searchQuery, setSearchQuery] = useState('');
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [showResults, setShowResults] = useState(false);

  const [countryQuery, setCountryQuery] = useState('');
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [showCountryResults, setShowCountryResults] = useState(false);

const [userName, setUserName] = useState(user?.user_name?.replace(/^@+/, '') || '');
const [initialName, setInitialName] = useState(user?.user_name?.replace(/^@+/, '') || '');

  // Estados para controlar cambios
  const [initialTeam, setInitialTeam] = useState<Team | null>(null);
  const [initialCountry, setInitialCountry] = useState<Country | null>(null);

  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const hasChanges =
    userName !== initialName ||
    selectedTeam?.team_id !== initialTeam?.team_id ||
    selectedCountry?.country_id !== initialCountry?.country_id;

  // Cargar datos actuales del usuario desde la bbdd
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('users')
        .select('user_name, user_team_id, user_country_id')
        .eq('id', user.id)
        .single();

      if (error || !data) return;

      // Nombre
      setUserName(data.user_name?.replace(/^@+/, '') || '');
setInitialName(data.user_name?.replace(/^@+/, '') || '');

      // Equipo
      if (data.user_team_id) {
        const { data: teamData } = await supabase
          .from('teams')
          .select('team_id, team_name, team_fullname, team_crest_url, team_country_id')
          .eq('team_id', data.user_team_id)
          .single();

        if (teamData) {
          setSelectedTeam(teamData);
          setInitialTeam(teamData);
        }
      }

      // País
      if (data.user_country_id) {
        const { data: countryData } = await supabase
          .from('countries')
          .select('country_id, country_name, country_flag_url')
          .eq('country_id', data.user_country_id)
          .single();

        if (countryData) {
          setSelectedCountry(countryData);
          setInitialCountry(countryData);
        }
      }
    };

    fetchUserData();
  }, [user]);

  // Búsqueda de equipos
  useEffect(() => {
    const fetchTeams = async () => {
      if (searchQuery.length < 2) {
        setTeams([]);
        return;
      }
      const { data } = await supabase
        .from('teams')
        .select('team_id, team_name, team_fullname, team_crest_url, team_country_id')
        .ilike('team_name', `%${searchQuery}%`)
        .not('team_id', 'ilike', 'INT%')
        .neq('team_country_id', 'INT')
        .limit(5);
      setTeams(data || []);
    };
    const timer = setTimeout(fetchTeams, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Búsqueda de países
  useEffect(() => {
    const fetchCountries = async () => {
      if (countryQuery.length < 2) {
        setCountries([]);
        return;
      }
      const { data } = await supabase
        .from('countries')
        .select('country_id, country_name, country_flag_url')
        .ilike('country_name', `%${countryQuery}%`)
        .limit(5);
      setCountries(data || []);
    };
    const timer = setTimeout(fetchCountries, 300);
    return () => clearTimeout(timer);
  }, [countryQuery]);

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    setSaveError(null);

    const { error } = await supabase
      .from('users')
      .update({
        user_name: userName,
        user_team_id: selectedTeam?.team_id ?? null,
        user_country_id: selectedCountry?.country_id ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (error) {
      setSaveError(error.message);
      setIsSaving(false);
      return;
    }

    // Sincronizar contexto de auth con el nuevo nombre
    await updateProfile({ user_name: userName });

    setInitialName(userName);
    setInitialTeam(selectedTeam);
    setInitialCountry(selectedCountry);
    setIsSaving(false);
  };

  return (
    <>
      <PageBanner
        title="Mi Perfil"
        tournament_banner_url="https://www.corrienteshoy.com/galeria/fotos/2023/02/27/o_1677541416.jpg"
      />

      <PageContent maxWidth="1600" layout="grid-side-left">

        {/* Columna Izquierda: Info Básica */}
        <div className="flex flex-col gap-6">
          <div className={`p-8 rounded-2xl border ${border} ${bgSurface} flex flex-col items-center text-center gap-2`}>
            <UserAvatar
              crestUrl={selectedTeam?.team_crest_url}
              size="w-32 h-32"
              crestSize="w-28 h-28"
              className="mb-2"
            />
            <h2 className={`text-2xl font-black ${textMain}`}>
              <span className={textMuted}>@</span>{user?.user_name?.replace(/^@+/, '') || 'usuario'}
            </h2>
            <PlanBadge plan={user?.user_plan || 'free'} />
          </div>
        </div>

        {/* Columna Derecha: Ajustes y Secciones */}
        <div className="flex flex-col gap-6">

          {/* Nombre de usuario */}
          <div className="flex flex-col gap-4">
            <h3 className={`text-xs uppercase tracking-widest font-bold ${textMuted} px-2`}>Nombre de usuario</h3>
            <div className={`flex items-center gap-0 rounded-2xl border ${border} ${bgSurface} px-4 py-4`}>
              <User size={20} className={`${textMuted} shrink-0 mr-3`} />
              <span className={`font-medium ${textMuted} select-none`}>@</span>
              <input
                type="text"
                placeholder="tu_nombre"
                value={userName}
                onChange={(e) => {
                  // Evitar que el usuario escriba el @ manualmente
                  const val = e.target.value.replace(/^@+/, '');
                  setUserName(val);
                }}
                autoComplete="username"
                className={`flex-1 bg-transparent outline-none font-medium ${textMain} placeholder:${textMuted}`}
              />
            </div>
          </div>

          {/* Club e Hincha */}
          <div className="flex flex-col gap-4">
            <h3 className={`text-xs uppercase tracking-widest font-bold ${textMuted} px-2`}>Club favorito</h3>
            <div className="relative">
              <Input
                type="text"
                placeholder="Busca tu club..."
                value={selectedTeam ? (selectedTeam.team_fullname || selectedTeam.team_name) : searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (selectedTeam) setSelectedTeam(null);
                  setShowResults(true);
                }}
                onFocus={() => setShowResults(true)}
                autoComplete="new-password"
                containerClassName="p-4 rounded-2xl"
                className="font-medium"
                customIcon={
                  selectedTeam?.team_crest_url ? (
                    <img src={selectedTeam.team_crest_url} className="w-6 h-6 object-contain" alt="" />
                  ) : (
                    <ShieldQuestion size={20} className={textMuted} />
                  )
                }
              />
              {showResults && teams.length > 0 && (
                <div className={`absolute left-0 right-0 top-full mt-2 z-10 rounded-xl border ${border} ${bgSurface} overflow-hidden shadow-2xl`}>
                  {teams.map(team => (
                    <button
                      key={team.team_id}
                      onClick={() => { setSelectedTeam(team); setShowResults(false); setSearchQuery(''); }}
                      className={`w-full p-4 flex items-center gap-3 ${bgSurfaceHover} transition-colors text-left`}
                    >
                      {team.team_crest_url && <img src={team.team_crest_url} className="w-6 h-6 object-contain" alt="" />}
                      <span className={`text-sm font-medium ${textMain}`}>{team.team_fullname || team.team_name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* País */}
          <div className="flex flex-col gap-4">
            <h3 className={`text-xs uppercase tracking-widest font-bold ${textMuted} px-2`}>País</h3>
            <div className="relative">
              <Input
                type="text"
                placeholder="Busca tu país..."
                value={selectedCountry ? selectedCountry.country_name : countryQuery}
                onChange={(e) => {
                  setCountryQuery(e.target.value);
                  if (selectedCountry) setSelectedCountry(null);
                  setShowCountryResults(true);
                }}
                onFocus={() => setShowCountryResults(true)}
                autoComplete="new-password"
                containerClassName="p-4 rounded-2xl"
                className="font-medium"
                customIcon={
                  selectedCountry?.country_flag_url ? (
                    <img src={selectedCountry.country_flag_url} className="w-6 h-auto object-contain" alt="" />
                  ) : (
                    <Globe size={20} className={textMuted} />
                  )
                }
              />
              {showCountryResults && countries.length > 0 && (
                <div className={`absolute left-0 right-0 top-full mt-2 z-10 rounded-xl border ${border} ${bgSurface} overflow-hidden shadow-2xl`}>
                  {countries.map(country => (
                    <button
                      key={country.country_id}
                      onClick={() => { setSelectedCountry(country); setShowCountryResults(false); setCountryQuery(''); }}
                      className={`w-full p-4 flex items-center gap-3 ${bgSurfaceHover} transition-colors text-left`}
                    >
                      {country.country_flag_url && <img src={country.country_flag_url} className="w-6 h-auto object-contain" alt="" />}
                      <span className={`text-sm font-medium ${textMain}`}>{country.country_name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Info de Cuenta */}
          <div className="flex flex-col gap-4">
            <h3 className={`text-xs uppercase tracking-widest font-bold ${textMuted} px-2`}>Cuenta</h3>
            <div className={`p-2 rounded-2xl border ${border} ${bgSurface} flex flex-col gap-1`}>
              <DropdownOption icon={Mail} label="Email" value={user?.email || '-'} />
            </div>
          </div>

          {/* Error de guardado */}
          {saveError && (
            <p className="text-sm text-red-500 px-2">{saveError}</p>
          )}

          {/* Acciones de Cuenta */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-8 mt-4 border-t border-white/5">

            <Button
              icon={Save}
              label={isSaving ? 'Guardando...' : 'Guardar Cambios'}
              disabled={!hasChanges || isSaving}
              onClick={handleSave}
              className="w-full md:w-auto"
            />
          </div>

        </div>
      </PageContent>
    </>
  );
} 