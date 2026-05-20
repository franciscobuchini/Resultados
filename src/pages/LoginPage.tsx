import { useNavigate } from 'react-router-dom';
import { useThemeClasses } from '../functions/themeStore';
import { useAuth } from '../functions/auth';
import { GoogleLogin } from '../components/ui/GoogleLogin';

export default function LoginPage() {
  const { bgApp, bgSurface, border, textMain, textMuted, textError } = useThemeClasses();
  const { error, user } = useAuth();
  const navigate = useNavigate();

  // Si ya está logueado, redirigir al perfil
  if (user) {
    navigate('/profile');
    return null;
  }

  return (
    <div className={`flex-1 flex items-center justify-center px-4 ${bgApp}`}>
      <div className={`w-full max-w-sm rounded-2xl border ${border} ${bgSurface} p-8 shadow-2xl`}>
        <div className="flex flex-col gap-6">
          <div className="text-center">
            <h1 className={`text-xl font-bold ${textMain}`}>Iniciar sesión</h1>
            <p className={`text-sm mt-1 ${textMuted}`}>
              Ingresá con tu cuenta de Google para continuar
            </p>
          </div>

          {/* Botón Google */}
          <GoogleLogin />

          {/* Error */}
          {error && (
            <p className={`text-xs ${textError} text-center`}>{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}

