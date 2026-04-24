import { supabase } from './supabaseClient'

export interface Profile {
  id: string;
  user_name: string;
  user_team_id: string | null;
  user_plan: string;
  user_province: string | null;
  user_city: string | null;
}

export const auth = {
  // Registrarse con email, password y username
  async signUp(email: string, password: string, userName: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          user_name: userName, // Esto se pasa al trigger de SQL
        },
      },
    })
    return { data, error }
  },

  // Iniciar sesión
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  },

  // Cerrar sesión
  async signOut() {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  // Obtener perfil del usuario desde public.profiles
  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    return { data: data as Profile, error }
  },

  // Actualizar perfil del usuario
  async updateProfile(userId: string, updates: Partial<Profile>) {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single()
    
    return { data: data as Profile, error }
  }
}
