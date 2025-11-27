import { create } from 'zustand';
import { supabase } from '../api/supabase';
import { Profile, UserConfig } from '../types';

interface AuthState {
  user: any | null;
  profile: Profile | null;
  config: UserConfig | null;
  loading: boolean;
  initialized: boolean;
  signIn: (email: string) => Promise<void>;
  loginAsAdmin: () => Promise<void>;
  signOut: () => Promise<void>;
  fetchProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  config: null,
  loading: true,
  initialized: false,

  signIn: async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) throw error;
  },

  loginAsAdmin: async () => {
    // Mock admin user
    const adminUser = {
      id: '00000000-0000-0000-0000-000000000000',
      email: 'admin@custo3d.app',
      user_metadata: { full_name: 'Administrador' }
    };

    // Fetch admin profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', adminUser.id)
      .single();

    const { data: config } = await supabase
      .from('user_configs')
      .select('*')
      .eq('user_id', adminUser.id)
      .single();

    set({ 
      user: adminUser, 
      profile: profile, 
      config: config, 
      loading: false, 
      initialized: true 
    });
    
    // Persist mock session in localStorage for persistence across reloads
    localStorage.setItem('custo3d_mock_session', 'true');
  },

  signOut: async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('custo3d_mock_session');
    set({ user: null, profile: null, config: null });
  },

  fetchProfile: async () => {
    // Check for mock session first
    if (localStorage.getItem('custo3d_mock_session') === 'true') {
      get().loginAsAdmin();
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      set({ user: null, profile: null, config: null, loading: false, initialized: true });
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    const { data: config } = await supabase
      .from('user_configs')
      .select('*')
      .eq('user_id', user.id)
      .single();

    set({ user, profile, config, loading: false, initialized: true });
  },
}));

// Initialize auth listener
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
    useAuthStore.getState().fetchProfile();
  } else if (event === 'SIGNED_OUT') {
    // Only clear if not in mock session
    if (localStorage.getItem('custo3d_mock_session') !== 'true') {
      useAuthStore.setState({ user: null, profile: null, config: null, loading: false });
    }
  }
});
