import { create } from 'zustand';
import { supabase } from '../api/supabase';
import { Profile, UserConfig } from '../types';

interface AuthState {
  user: any | null;
  profile: Profile | null;
  config: UserConfig | null;
  loading: boolean;
  initialized: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  fetchProfile: () => Promise<void>;
}

// Removido 'get' dos parâmetros pois não estava sendo usado
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  config: null,
  loading: true,
  initialized: false,

  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  },

  signUp: async (email, password, fullName) => {
    // Envia o nome nos metadados para o Trigger SQL pegar
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    if (error) throw error;
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, profile: null, config: null });
  },

  fetchProfile: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      set({ user: null, profile: null, config: null, loading: false, initialized: true });
      return;
    }

    try {
      const [profileRes, configRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
        supabase.from('user_configs').select('*').eq('user_id', user.id).maybeSingle()
      ]);

      set({ 
        user, 
        profile: profileRes.data, 
        config: configRes.data, 
        loading: false, 
        initialized: true 
      });
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      set({ loading: false, initialized: true });
    }
  },
}));

// Removido 'session' dos parâmetros pois não estava sendo usado
supabase.auth.onAuthStateChange((event) => {
  if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
    useAuthStore.getState().fetchProfile();
  } else if (event === 'SIGNED_OUT') {
    useAuthStore.setState({ user: null, profile: null, config: null, loading: false });
  }
});