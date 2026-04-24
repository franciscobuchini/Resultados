import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import AuthModal from './AuthModal'
import ProfileEditor from './ProfileEditor'

export default function UserMenu() {
  const { user, profile, loading } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)

  if (loading) return null

  return (
    <>
      <>
        {!user ? (
          <button 
            onClick={() => setShowAuthModal(true)}
            className="bg-zinc-900 border border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800 px-3 sm:px-4 h-8 sm:h-10 rounded-full flex items-center gap-2 transition-all shadow-2xl cursor-pointer font-mono"
          >
            <span className="text-[10px] sm:text-xs text-white font-bold uppercase">Iniciar Sesión</span>
          </button>
        ) : (
          <button 
            onClick={() => setShowProfileModal(true)}
            className="bg-zinc-900 border border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800 px-3 sm:px-4 h-8 sm:h-10 rounded-full flex items-center gap-2 transition-all shadow-2xl cursor-pointer font-mono"
          >
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500"></div>
            <span className="text-[10px] sm:text-xs text-white font-bold">{profile?.user_name || 'Mi Perfil'}</span>
          </button>
        )}
      </>

      {showAuthModal && !user && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}

      {showProfileModal && user && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="relative w-full max-w-md">
            <button 
              onClick={() => setShowProfileModal(false)} 
              className="absolute top-4 right-4 text-zinc-500 hover:text-white z-10"
            >
              ✕
            </button>
            <ProfileEditor />
          </div>
        </div>
      )}
    </>
  )
}
