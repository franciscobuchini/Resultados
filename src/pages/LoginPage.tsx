import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowRight, Check, Loader2 } from 'lucide-react';
import { useThemeClasses } from '../functions/themeStore';
import { useAuth } from '../functions/auth';

export default function LoginPage() {
  const { bgApp, bgSurface, border, textMain, textMuted, textAccent, textError, textSuccess, bgSurfaceHover } = useThemeClasses();
  const { sendMagicLink, loading, error, clearError, user } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  // Si ya está logueado, redirigir al perfil
  if (user) {
    navigate('/profile');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    try {
      await sendMagicLink(email.trim());
      setSent(true);
    } catch {
      // El error ya se maneja en el store
    }
  };

  const handleRetry = () => {
    setSent(false);
    clearError();
  };

  return (
    <div className={`flex-1 flex items-center justify-center px-4 ${bgApp}`}>
      <div className={`w-full max-w-sm rounded-2xl border ${border} ${bgSurface} p-8 shadow-2xl`}>

        {/* Estado: Link enviado */}
        {sent && !error ? (
          <div className="flex flex-col items-center text-center gap-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${textSuccess}`}
              style={{ background: 'rgba(34, 197, 94, 0.1)' }}
            >
              <Check size={32} />
            </div>
            <h1 className={`text-xl font-bold ${textMain}`}>¡Revisá tu email!</h1>
            <p className={`text-sm ${textMuted}`}>
              Te enviamos un link mágico a <span className={`font-medium ${textMain}`}>{email}</span>.
              <br />Hacé click en el link para iniciar sesión.
            </p>
            <button
              onClick={handleRetry}
              className={`mt-4 text-sm ${textAccent} hover:underline cursor-pointer`}
            >
              Usar otro email
            </button>
          </div>
        ) : (
          /* Estado: Formulario */
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="text-center">
              <h1 className={`text-xl font-bold ${textMain}`}>Iniciar sesión</h1>
              <p className={`text-sm mt-1 ${textMuted}`}>
                Ingresá tu email y te enviamos un link para entrar
              </p>
            </div>

            {/* Input de Email */}
            <div className={`flex items-center gap-3 rounded-xl border ${border} px-4 py-3 transition-colors focus-within:ring-1 focus-within:ring-white/20`}>
              <Mail size={18} className={textMuted} />
              <input
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); clearError(); }}
                required
                autoFocus
                autoComplete="email"
                className={`bg-transparent border-none outline-none ${textMain} w-full text-sm placeholder:${textMuted}`}
              />
            </div>

            {/* Error */}
            {error && (
              <p className={`text-xs ${textError} text-center`}>{error}</p>
            )}

            {/* Botón */}
            <button
              type="submit"
              disabled={loading || !email.trim()}
              className={`flex items-center justify-center gap-2 rounded-xl border ${border} ${bgSurfaceHover} px-4 py-3 text-sm font-medium ${textMain} transition-all cursor-pointer active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  Enviar link mágico
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
