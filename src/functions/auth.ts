import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { User } from '@supabase/supabase-js'
import { supabase } from './supabase'

// --- TIPOS ---
export interface AuthUser {
  id: string;
  email: string | undefined;
  user_name: string;
  user_team_id: string | null;
  user_plan: string;
  user_province: string | null;
  user_city: string | null;
}

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  /** Envía un magic link al email del usuario */
  sendMagicLink: (email: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<AuthUser>) => Promise<void>;
  clearError: () => void;
}

// --- LÓGICA INTERNA (SERVICE) ---
const mapUser = (sbUser: User): AuthUser => ({
  id: sbUser.id,
  email: sbUser.email,
  user_name: sbUser.user_metadata?.user_name || sbUser.email?.split('@')[0] || 'Usuario',
  user_team_id: sbUser.user_metadata?.user_team_id || null,
  user_plan: sbUser.user_metadata?.user_plan || 'free',
  user_province: sbUser.user_metadata?.user_province || null,
  user_city: sbUser.user_metadata?.user_city || null,
})

// --- STORE GLOBAL (ZUSTAND + PERSISTENCE) ---
export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      loading: false,
      error: null,

      sendMagicLink: async (email) => {
        set({ loading: true, error: null })
        try {
          const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
              // Redirige al usuario de vuelta a la app después de hacer click en el link
              emailRedirectTo: window.location.origin,
            }
          })
          if (error) throw error
          set({ loading: false })
        } catch (err) {
          const error = err as Error
          set({ error: error.message, loading: false })
          throw err
        }
      },

      signInWithGoogle: async () => {
        set({ loading: true, error: null })
        try {
          const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
              redirectTo: window.location.origin,
            }
          })
          if (error) throw error
        } catch (err) {
          const error = err as Error
          set({ error: error.message, loading: false })
          throw err
        }
      },

      logout: async () => {
        await supabase.auth.signOut()
        set({ user: null, error: null })
      },

      updateProfile: async (updates) => {
        set({ loading: true })
        try {
          const { data, error } = await supabase.auth.updateUser({ data: updates })
          if (error) throw error

          // Sincronizar con public.users
          const dbUpdates: Record<string, any> = {};
          if (updates.user_name !== undefined) dbUpdates.user_name = updates.user_name;
          if (updates.user_team_id !== undefined) dbUpdates.user_team_id = updates.user_team_id;
          if (updates.user_province !== undefined) dbUpdates.user_province = updates.user_province;
          if (updates.user_city !== undefined) dbUpdates.user_city = updates.user_city;
          if (Object.keys(dbUpdates).length > 0) {
            const { error: dbError } = await supabase
              .from('users')
              .update(dbUpdates)
              .eq('id', data.user.id);
            if (dbError) console.warn('Error syncing to public.users:', dbError.message);
          }

          set({ user: mapUser(data.user), loading: false })
        } catch (err) {
          const error = err as Error
          set({ error: error.message, loading: false })
          throw err
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

// Escucha cambios de sesión de Supabase (ej: cuando el usuario hace click en el magic link)
supabase.auth.onAuthStateChange((_event, session) => {
  if (session?.user) {
    useAuth.setState({ user: mapUser(session.user) })
  } else {
    useAuth.setState({ user: null })
  }
})
