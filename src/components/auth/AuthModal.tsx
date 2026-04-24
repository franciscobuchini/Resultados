import { useState } from 'react'
import { auth } from '../../functions/auth'

export default function AuthModal({ onClose }: { onClose: () => void }) {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [userName, setUserName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isLogin) {
        const { error } = await auth.signIn(email, password)
        if (error) throw error
      } else {
        if (!userName.trim()) throw new Error("El nombre de usuario es requerido")
        const { error } = await auth.signUp(email, password, userName)
        if (error) throw error
      }
      onClose() // Cerrar modal al tener éxito
    } catch (err: any) {
      setError(err.message || 'Error de autenticación')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-900 border border-zinc-800 p-6 rounded-xl w-full max-w-sm relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-white">
          ✕
        </button>
        
        <h2 className="text-xl text-white font-bold mb-6 font-mono text-center">
          {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {!isLogin && (
            <div>
              <label className="text-[10px] uppercase font-mono text-zinc-500 mb-1 block">Usuario</label>
              <input 
                type="text" 
                value={userName} 
                onChange={e => setUserName(e.target.value)}
                className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-200 outline-none focus:border-emerald-500 transition-colors"
                required={!isLogin}
              />
            </div>
          )}

          <div>
            <label className="text-[10px] uppercase font-mono text-zinc-500 mb-1 block">Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-200 outline-none focus:border-emerald-500 transition-colors"
              required
            />
          </div>

          <div>
            <label className="text-[10px] uppercase font-mono text-zinc-500 mb-1 block">Contraseña</label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-200 outline-none focus:border-emerald-500 transition-colors"
              required
            />
          </div>

          {error && <div className="text-red-400 text-xs bg-red-950/30 p-2 rounded">{error}</div>}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded font-mono text-sm mt-2 transition-colors disabled:opacity-50"
          >
            {loading ? 'Procesando...' : (isLogin ? 'Entrar' : 'Registrarse')}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button 
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            className="text-xs text-zinc-400 hover:text-white font-mono"
          >
            {isLogin ? '¿No tenés cuenta? Registrate' : '¿Ya tenés cuenta? Iniciá sesión'}
          </button>
        </div>
      </div>
    </div>
  )
}
