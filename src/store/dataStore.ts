import { create } from 'zustand';
import { supabase } from '../api/supabase';
import { Filament, Marketplace, Print, UserConfig } from '../types';
import { useAuthStore } from './authStore';

interface DataState {
  filaments: Filament[];
  marketplaces: Marketplace[];
  prints: Print[];
  loading: boolean;
  
  fetchData: () => Promise<void>;
  
  addFilament: (filament: Omit<Filament, 'id' | 'created_at' | 'user_id'>) => Promise<void>;
  updateFilament: (id: string, filament: Partial<Filament>) => Promise<void>;
  deleteFilament: (id: string) => Promise<void>;
  addFilamentPurchase: (id: string, rolls: number) => Promise<void>;
  
  addMarketplace: (marketplace: Omit<Marketplace, 'id' | 'created_at' | 'user_id'>) => Promise<void>;
  updateMarketplace: (id: string, marketplace: Partial<Marketplace>) => Promise<void>;
  deleteMarketplace: (id: string) => Promise<void>;
  
  addPrint: (print: Omit<Print, 'id' | 'created_at' | 'user_id'>) => Promise<void>;
  updatePrint: (id: string, print: Partial<Print>) => Promise<void>;
  deletePrint: (id: string) => Promise<void>;

  updateConfig: (config: Partial<UserConfig>) => Promise<void>;
}

export const useDataStore = create<DataState>((set, get) => ({
  filaments: [],
  marketplaces: [],
  prints: [],
  loading: false,

  fetchData: async () => {
    set({ loading: true });
    try {
      const [filamentsRes, marketplacesRes, printsRes] = await Promise.all([
        supabase.from('filaments').select('*').order('name'),
        supabase.from('marketplaces').select('*').order('name'),
        supabase.from('prints').select('*').order('print_date', { ascending: false }),
      ]);

      if (filamentsRes.error) throw filamentsRes.error;
      if (marketplacesRes.error) throw marketplacesRes.error;
      if (printsRes.error) throw printsRes.error;

      set({
        filaments: filamentsRes.data,
        marketplaces: marketplacesRes.data,
        prints: printsRes.data,
      });
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      set({ loading: false });
    }
  },

  addFilament: async (filament) => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    const { data, error } = await supabase
      .from('filaments')
      .insert([{ ...filament, user_id: user.id }])
      .select()
      .single();

    if (error) throw error;
    set((state) => ({ filaments: [...state.filaments, data] }));
  },

  updateFilament: async (id, filament) => {
    const { data, error } = await supabase
      .from('filaments')
      .update(filament)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    set((state) => ({
      filaments: state.filaments.map((f) => (f.id === id ? data : f)),
    }));
  },

  deleteFilament: async (id) => {
    const { error } = await supabase.from('filaments').delete().eq('id', id);
    if (error) throw error;
    set((state) => ({ filaments: state.filaments.filter((f) => f.id !== id) }));
  },

  addFilamentPurchase: async (id, rolls) => {
    const filament = get().filaments.find(f => f.id === id);
    if (!filament) return;

    const gramsToAdd = rolls * filament.grams_per_roll;
    const newRolls = (filament.rolls || 0) + rolls;
    const newWeight = (filament.current_weight_g || 0) + gramsToAdd;

    const { data, error } = await supabase
      .from('filaments')
      .update({ 
        rolls: newRolls,
        current_weight_g: newWeight
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    set((state) => ({
      filaments: state.filaments.map((f) => (f.id === id ? data : f)),
    }));
  },

  addMarketplace: async (marketplace) => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    const { data, error } = await supabase
      .from('marketplaces')
      .insert([{ ...marketplace, user_id: user.id }])
      .select()
      .single();

    if (error) throw error;
    set((state) => ({ marketplaces: [...state.marketplaces, data] }));
  },

  updateMarketplace: async (id, marketplace) => {
    const { data, error } = await supabase
      .from('marketplaces')
      .update(marketplace)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    set((state) => ({
      marketplaces: state.marketplaces.map((m) => (m.id === id ? data : m)),
    }));
  },

  deleteMarketplace: async (id) => {
    const { error } = await supabase.from('marketplaces').delete().eq('id', id);
    if (error) throw error;
    set((state) => ({ marketplaces: state.marketplaces.filter((m) => m.id !== id) }));
  },

  addPrint: async (print) => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    // 1. Insert the print
    const { data: printData, error: printError } = await supabase
      .from('prints')
      .insert([{ ...print, user_id: user.id }])
      .select()
      .single();

    if (printError) throw printError;

    // 2. Update filament stock if a filament was used
    if (print.filaments_used && print.filaments_used.length > 0) {
      for (const usage of print.filaments_used) {
        const filament = get().filaments.find(f => f.id === usage.filament_id);
        if (filament && filament.current_weight_g !== null) {
          const newWeight = Math.max(0, filament.current_weight_g - usage.material_weight_g);
          
          // Calculate remaining rolls (approximate)
          const newRolls = Math.floor(newWeight / filament.grams_per_roll);

          const { error: filamentError } = await supabase
            .from('filaments')
            .update({ 
              current_weight_g: newWeight,
              rolls: newRolls
            })
            .eq('id', usage.filament_id);

          if (!filamentError) {
            // Update local state for filament
            set((state) => ({
              filaments: state.filaments.map(f => 
                f.id === usage.filament_id ? { ...f, current_weight_g: newWeight, rolls: newRolls } : f
              )
            }));
          }
        }
      }
    }

    set((state) => ({ prints: [printData, ...state.prints] }));
  },

  updatePrint: async (id, print) => {
    const { data, error } = await supabase
      .from('prints')
      .update(print)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    set((state) => ({
      prints: state.prints.map((p) => (p.id === id ? data : p)),
    }));
  },

  deletePrint: async (id) => {
    const { error } = await supabase.from('prints').delete().eq('id', id);
    if (error) throw error;
    set((state) => ({ prints: state.prints.filter((p) => p.id !== id) }));
  },

  updateConfig: async (config) => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    const { data, error } = await supabase
      .from('user_configs')
      .update(config)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;
    useAuthStore.setState((state) => ({
      config: state.config ? { ...state.config, ...data } : data
    }));
  },
}));

