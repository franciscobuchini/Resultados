import { create } from 'zustand'
import type { User } from '@supabase/supabase-js'
import { supabase } from './supabase'

// --- TIPOS ---
export interface AuthUser {
  id: string;
  email: string | undefined;
  user_name: string;
  user_team_id: string | null;
  user_plan: string;
  user_country_id: string | null;
}

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  initialized: boolean;
  error: string | null;
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
  user_country_id: sbUser.user_metadata?.user_country_id || null,
})

// --- STORE GLOBAL (ZUSTAND) ---
export const useAuth = create<AuthState>((set) => ({
  user: null,
  loading: false,
  initialized: false,
  error: null,

  sendMagicLink: async (email) => {
    set({ loading: true, error: null })
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
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

      const dbUpdates: Record<string, any> = {};
      if (updates.user_name !== undefined) dbUpdates.user_name = updates.user_name;
      if (updates.user_team_id !== undefined) dbUpdates.user_team_id = updates.user_team_id;
      if (updates.user_country_id !== undefined) dbUpdates.user_country_id = updates.user_country_id;
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
}))

// Escucha cambios de sesión de Supabase
supabase.auth.onAuthStateChange(async (_event, session) => {
  console.log('[Auth] onAuthStateChange event:', _event, 'user:', session?.user?.id);
  if (session?.user) {
    // 1. Establecer el estado inicial rápido con los metadatos de la sesión
    const initialUser = mapUser(session.user);
    console.log('[Auth] Setting initial user from session metadata:', initialUser);
    useAuth.setState({ user: initialUser, initialized: true });

    // 2. Consultar la base de datos para obtener los datos más actualizados de forma diferida (evita deadlock)
    setTimeout(async () => {
      console.log('[Auth] Fetching database profile for:', session.user.id);
      const { data, error } = await supabase
        .from('users')
        .select('user_name, user_team_id, user_plan, user_country_id')
        .eq('id', session.user.id)
        .single();

      if (error) {
        console.warn('[auth.onAuthStateChange] Error fetching database profile (expected if new user):', error.message, error);
      } else {
        console.log('[Auth] Database profile loaded:', data);
      }

      if (data && !error) {
        useAuth.setState((state) => ({
          user: state.user ? { ...state.user, ...data } : null
        }));
      }
    }, 0);
  } else {
    console.log('[Auth] No session found');
    useAuth.setState({ user: null, initialized: true });
  }
})