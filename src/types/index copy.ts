export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  brand_name: string | null;
  occupation: string | null;
  created_at: string;
}

export interface UserConfig {
  id: string;
  user_id: string;
  tarifa_energia: number;
  custo_hora_impressora: number;
  potencia_impressora: number;
  margem_padrao: number;
  moeda: string;
  created_at: string;
}

export interface Filament {
  id: string;
  user_id: string;
  name: string;
  type: string;
  color: string | null;
  roll_weight_g: number;
  roll_price: number;
  brand: string | null;
  min_stock_alert_g: number;
  current_weight_g: number | null;
  rolls: number;
  grams_per_roll: number;
  created_at: string;
}

export interface Marketplace {
  id: string;
  user_id: string;
  name: string;
  fee_percent: number;
  fee_fixed: number;
  notes: string | null;
  created_at: string;
}

export interface FilamentUsage {
  filament_id: string;
  material_weight_g: number;
  cost: number;
}

export interface Print {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  print_date: string;
  filaments_used: FilamentUsage[];
  print_time_minutes: number;
  energy_rate: number | null;
  printer_power_w: number | null;
  cost_filament: number | null;
  cost_energy: number | null;
  cost_depreciation: number | null;
  cost_additional: number | null;
  marketplace_id: string | null;
  marketplace_fee: number | null;
  sale_price: number | null;
  total_cost: number | null;
  profit: number | null;
  real_margin: number | null;
  created_at: string;
}
