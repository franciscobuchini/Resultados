import { useEffect, useState } from 'react';
import { Mail, Calendar, Globe, ShieldQuestion } from 'lucide-react';
import PageBanner from '../layout/PageBanner';
import PageContent from '../layout/PageContent';
import { useThemeClasses } from '../functions/themeStore';
import { DropdownOption } from '../components/ui/Dropdown';
import { PlanBadge } from '../components/ui/Badge';
import { supabase } from '../functions/supabase';
import UserAvatar from '../components/ui/UserAvatar';
import { Button } from '../components/ui/Button';
import { Save } from 'lucide-react';

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

  // Datos mock para el perfil
  const [userData] = useState({
    name: 'Usuario Demo',
    email: 'usuario@resultados.ar',
    joined: '10 Mayo 2024',
    plan: 'admin'
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [showResults, setShowResults] = useState(false);

  const [countryQuery, setCountryQuery] = useState('');
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [showCountryResults, setShowCountryResults] = useState(false);

  // Estados para controlar cambios
  const [initialTeam, setInitialTeam] = useState<Team | null>(null);
  const [initialCountry, setInitialCountry] = useState<Country | null>(null);

  const hasChanges = selectedTeam?.team_id !== initialTeam?.team_id || 
                     selectedCountry?.country_id !== initialCountry?.country_id;

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
                flagUrl={selectedCountry?.country_flag_url}
                size="w-32 h-32"
                crestSize="w-28 h-28"
                className="mb-2"
              />
              <h2 className={`text-2xl font-black ${textMain}`}>{userData.name}</h2>
              <PlanBadge plan={userData.plan} />
            </div>
          </div>

          {/* Columna Derecha: Ajustes y Secciones */}
          <div className="flex flex-col gap-6">
            
            {/* Club e Hincha */}
            <div className="flex flex-col gap-4">
              <div className={`p-4 rounded-2xl border ${border} ${bgSurface} relative`}>
                <div className="flex items-center gap-4">
                  <div className={`${textMuted} w-6 h-6 flex items-center justify-center shrink-0`}>
                    {selectedTeam?.team_crest_url ? (
                      <img src={selectedTeam.team_crest_url} className="w-6 h-6 object-contain" alt="" />
                    ) : (
                      <ShieldQuestion size={20} />
                    )}
                  </div>
                  <div className="flex-1">
                    <input 
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
                      className={`bg-transparent border-none outline-none ${textMain} w-full text-sm font-medium`}
                    />
                  </div>
                </div>
                {showResults && teams.length > 0 && (
                  <div className={`absolute left-0 right-0 top-full mt-2 z-10 rounded-xl border ${border} ${bgSurface} overflow-hidden shadow-2xl`}>
                    {teams.map(team => (
                      <button key={team.team_id} onClick={() => { setSelectedTeam(team); setShowResults(false); setSearchQuery(''); }} className={`w-full p-4 flex items-center gap-3 ${bgSurfaceHover} transition-colors text-left`}>
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
              <div className={`p-4 rounded-2xl border ${border} ${bgSurface} relative`}>
                <div className="flex items-center gap-4">
                  <div className={`${textMuted} w-6 h-6 flex items-center justify-center shrink-0`}>
                    {selectedCountry?.country_flag_url ? (
                      <img src={selectedCountry.country_flag_url} className="w-6 h-auto object-contain" alt="" />
                    ) : (
                      <Globe size={20} />
                    )}
                  </div>
                  <div className="flex-1">
                    <input 
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
                      className={`bg-transparent border-none outline-none ${textMain} w-full text-sm font-medium`}
                    />
                  </div>
                </div>
                {showCountryResults && countries.length > 0 && (
                  <div className={`absolute left-0 right-0 top-full mt-2 z-10 rounded-xl border ${border} ${bgSurface} overflow-hidden shadow-2xl`}>
                    {countries.map(country => (
                      <button key={country.country_id} onClick={() => { setSelectedCountry(country); setShowCountryResults(false); setCountryQuery(''); }} className={`w-full p-4 flex items-center gap-3 ${bgSurfaceHover} transition-colors text-left`}>
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
                <DropdownOption icon={Mail} label="Email" value={userData.email} />
                <DropdownOption icon={Calendar} label="Miembro desde" value={userData.joined} />
              </div>
            </div>

            {/* Acciones de Cuenta */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-8 mt-4 border-t border-white/5">
              <Button 
                variant="danger"
                label="Eliminar cuenta"
                onClick={() => {
                  if (confirm('¿Estás seguro de que deseas eliminar tu cuenta?')) {
                    alert('Cuenta eliminada (Simulación)');
                  }
                }}
              />
              
              <Button 
                icon={Save}
                label="Guardar Cambios"
                disabled={!hasChanges}
                onClick={() => {
                  alert('Cambios guardados (Simulación)');
                  setInitialTeam(selectedTeam);
                  setInitialCountry(selectedCountry);
                }}
                className="w-full md:w-auto"
              />
            </div>

          </div>
      </PageContent>
    </>
  );
}
