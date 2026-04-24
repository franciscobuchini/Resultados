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
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string, userName: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<AuthUser>) => Promise<void>;
}

// --- LÓGICA INTERNA (SERVICE) ---
const mapUser = (sbUser: User): AuthUser => ({
  id: sbUser.id,
  email: sbUser.email,
  user_name: sbUser.user_metadata?.user_name || 'Usuario',
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

      login: async (email, pass) => {
        set({ loading: true, error: null })
        try {
          const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass })
          if (error) throw error
          set({ user: mapUser(data.user), loading: false })
        } catch (err) {
          const error = err as Error
          set({ error: error.message, loading: false })
          throw err
        }
      },

      register: async (email, pass, userName) => {
        set({ loading: true, error: null })
        try {
          const { data, error } = await supabase.auth.signUp({
            email, password: pass,
            options: { data: { user_name: userName, user_plan: 'free' } }
          })
          if (error) throw error
          if (!data.user) throw new Error("No se pudo crear el usuario")
          set({ user: mapUser(data.user), loading: false })
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
          set({ user: mapUser(data.user), loading: false })
        } catch (err) {
          const error = err as Error
          set({ error: error.message, loading: false })
          throw err
        }
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

// Escucha cambios de sesión de Supabase (ej: si expira el token)
supabase.auth.onAuthStateChange((_event, session) => {
  if (session?.user) {
    useAuth.setState({ user: mapUser(session.user) })
  } else {
    useAuth.setState({ user: null })
  }
})
