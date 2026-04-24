import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { auth } from '../../functions/auth'
import { supabase } from '../../functions/supabaseClient'

export default function ProfileEditor() {
  const { user, profile, refreshProfile } = useAuth()

  const [saving, setSaving] = useState(false)
  const [teams, setTeams] = useState<{team_id: string, team_name: string}[]>([])
  
  const [formData, setFormData] = useState({
    user_team_id: '',
    user_province: '',
    user_city: ''
  })
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null)

  useEffect(() => {
    // Cargar lista de equipos
    supabase.from('teams').select('team_id, team_name').order('team_name')
      .then(({ data }) => setTeams(data || []))
  }, [])

  useEffect(() => {
    if (profile) {
      setFormData({
        user_team_id: profile.user_team_id || '',
        user_province: profile.user_province || '',
        user_city: profile.user_city || ''
      })
    }
  }, [profile])

  if (!user || !profile) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      const { error } = await auth.updateProfile(user.id, {
        user_team_id: formData.user_team_id || null,
        user_province: formData.user_province,
        user_city: formData.user_city
      })
      
      if (error) throw error
      await refreshProfile()
      setMessage({ type: 'success', text: 'Perfil actualizado correctamente' })
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error al actualizar perfil' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-neutral-900 border border-zinc-800 p-6 rounded-xl w-full max-w-md mx-auto my-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl text-white font-bold font-mono">Mi Perfil</h2>
        <span className="text-xs bg-zinc-800 text-zinc-300 px-2 py-1 rounded font-mono uppercase">Plan: {profile.user_plan}</span>
      </div>

      <div className="mb-6 pb-6 border-b border-zinc-800">
        <p className="text-zinc-400 text-sm mb-1"><span className="text-zinc-500 font-mono">Usuario:</span> {profile.user_name}</p>
        <p className="text-zinc-400 text-sm"><span className="text-zinc-500 font-mono">Email:</span> {user.email}</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="text-[10px] uppercase font-mono text-zinc-500 mb-1 block">Equipo Favorito</label>
          <select 
            value={formData.user_team_id} 
            onChange={e => setFormData({...formData, user_team_id: e.target.value})}
            className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-200 outline-none focus:border-emerald-500 transition-colors"
          >
            <option value="">-- Ninguno --</option>
            {teams.map(t => (
              <option key={t.team_id} value={t.team_id}>{t.team_name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[10px] uppercase font-mono text-zinc-500 mb-1 block">Provincia</label>
          <input 
            type="text" 
            value={formData.user_province} 
            onChange={e => setFormData({...formData, user_province: e.target.value})}
            className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-200 outline-none focus:border-emerald-500 transition-colors"
            placeholder="Ej: Buenos Aires"
          />
        </div>

        <div>
          <label className="text-[10px] uppercase font-mono text-zinc-500 mb-1 block">Ciudad</label>
          <input 
            type="text" 
            value={formData.user_city} 
            onChange={e => setFormData({...formData, user_city: e.target.value})}
            className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-200 outline-none focus:border-emerald-500 transition-colors"
            placeholder="Ej: Mar del Plata"
          />
        </div>

        {message && (
          <div className={`text-xs p-2 rounded ${message.type === 'success' ? 'bg-emerald-950/30 text-emerald-400' : 'bg-red-950/30 text-red-400'}`}>
            {message.text}
          </div>
        )}

        <button 
          type="submit" 
          disabled={saving}
          className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-2 rounded font-mono text-sm mt-2 transition-colors disabled:opacity-50"
        >
          {saving ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </form>

      <div className="mt-8 pt-4 border-t border-zinc-800">
        <button 
          onClick={() => auth.signOut()}
          className="text-xs text-red-400 hover:text-red-300 font-mono font-bold uppercase transition-colors"
        >
          Cerrar Sesión
        </button>
      </div>
    </div>
  )
}
