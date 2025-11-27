import React, { useEffect, useMemo } from 'react';
import { useDataStore } from '../store/dataStore';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  BarChart, Bar
} from 'recharts';
import { DollarSign, TrendingUp, Package, Activity, AlertTriangle } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export const Dashboard = () => {
  const { prints, filaments, marketplaces, fetchData, loading } = useDataStore();

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Metrics Calculations ---
  const totalRevenue = prints.reduce((acc, p) => acc + (p.sale_price || 0), 0);
  const totalProfit = prints.reduce((acc, p) => acc + (p.profit || 0), 0);
  const totalCost = prints.reduce((acc, p) => acc + (p.total_cost || 0), 0);
  const totalPrints = prints.length;

  // --- Low Stock Alerts ---
  const lowStockFilaments = filaments.filter(f => 
    f.current_weight_g !== null && f.current_weight_g < (f.min_stock_alert_g || 100)
  );

  // --- Charts Data Preparation ---
  
  // 1. Cost Distribution
  const costDistribution = [
    { name: 'Filamento', value: prints.reduce((acc, p) => acc + (p.cost_filament || 0), 0) },
    { name: 'Energia', value: prints.reduce((acc, p) => acc + (p.cost_energy || 0), 0) },
    { name: 'Depreciação', value: prints.reduce((acc, p) => acc + (p.cost_depreciation || 0), 0) },
    { name: 'Taxas', value: prints.reduce((acc, p) => acc + (p.marketplace_fee || 0), 0) },
    { name: 'Outros', value: prints.reduce((acc, p) => acc + (p.cost_additional || 0), 0) },
  ].filter(d => d.value > 0);

  // 2. Revenue by Marketplace (including Direct Sales)
  const revenueByMarketplace = useMemo(() => {
    const data: Record<string, number> = { 'Venda Direta': 0 };
    
    // Initialize known marketplaces
    marketplaces.forEach(m => data[m.name] = 0);

    prints.forEach(p => {
      if (p.marketplace_id) {
        const m = marketplaces.find(m => m.id === p.marketplace_id);
        const name = m ? m.name : 'Desconhecido';
        data[name] = (data[name] || 0) + (p.sale_price || 0);
      } else {
        data['Venda Direta'] += (p.sale_price || 0);
      }
    });

    return Object.entries(data)
      .map(([name, value]) => ({ name, value }))
      .filter(d => d.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [prints, marketplaces]);

  // 3. Top Revenue Parts (Revenue per Part)
  const revenueByPart = useMemo(() => {
    const data: Record<string, number> = {};
    prints.forEach(p => {
      data[p.name] = (data[p.name] || 0) + (p.sale_price || 0);
    });
    return Object.entries(data)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Top 5
  }, [prints]);

  // 4. Monthly Evolution (Mocked for now as we need date grouping logic)
  // In a real app, we would group `prints` by month using `p.print_date`
  const monthlyData = [
    { name: 'Jan', lucro: 400, custo: 240 },
    { name: 'Fev', lucro: 300, custo: 139 },
    { name: 'Mar', lucro: 200, custo: 980 },
    { name: 'Abr', lucro: 278, custo: 390 },
    { name: 'Mai', lucro: 189, custo: 480 },
    { name: 'Jun', lucro: 239, custo: 380 },
  ];

  if (loading) {
    return <div className="text-white">Carregando dados...</div>;
  }

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400">Visão geral do seu negócio de impressão 3D</p>
        </div>
        <div className="flex gap-4">
          <select className="bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-2">
            <option>2025</option>
            <option>2024</option>
          </select>
        </div>
      </header>

      {/* Low Stock Alert */}
      {lowStockFilaments.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="text-red-400" size={24} />
            <h3 className="text-xl font-bold text-red-400">Alerta de Estoque Baixo</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lowStockFilaments.map(f => (
              <div key={f.id} className="bg-gray-800 p-4 rounded-lg border border-gray-700 flex justify-between items-center">
                <div>
                  <p className="font-bold text-white">{f.name}</p>
                  <p className="text-sm text-gray-400">{f.brand} - {f.type}</p>
                </div>
                <div className="text-right">
                  <p className="text-red-400 font-bold">{f.current_weight_g}g</p>
                  <p className="text-xs text-gray-500">Mín: {f.min_stock_alert_g}g</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard 
          title="Faturamento Anual" 
          value={`R$ ${totalRevenue.toFixed(2)}`} 
          icon={DollarSign} 
          color="text-green-400" 
        />
        <KpiCard 
          title="Lucro Anual" 
          value={`R$ ${totalProfit.toFixed(2)}`} 
          icon={TrendingUp} 
          color="text-cyan-400" 
        />
        <KpiCard 
          title="Custo Total" 
          value={`R$ ${totalCost.toFixed(2)}`} 
          icon={Activity} 
          color="text-red-400" 
        />
        <KpiCard 
          title="Peças Produzidas" 
          value={totalPrints} 
          icon={Package} 
          color="text-purple-400" 
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Revenue by Marketplace */}
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h3 className="text-xl font-semibold text-white mb-6">Faturamento por Canal</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueByMarketplace} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
                <XAxis type="number" stroke="#9ca3af" />
                <YAxis dataKey="name" type="category" stroke="#9ca3af" width={100} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                  formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Faturamento']}
                />
                <Bar dataKey="value" fill="#00E5FF" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Parts by Revenue */}
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h3 className="text-xl font-semibold text-white mb-6">Top 5 Peças (Faturamento)</h3>
          <div className="space-y-4">
            {revenueByPart.map((part, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-700 text-xs font-bold text-gray-400">
                    {index + 1}
                  </span>
                  <span className="text-white font-medium">{part.name}</span>
                </div>
                <span className="text-green-400 font-bold">R$ {part.value.toFixed(2)}</span>
              </div>
            ))}
            {revenueByPart.length === 0 && (
              <p className="text-gray-500 text-center py-8">Nenhuma venda registrada.</p>
            )}
          </div>
        </div>

        {/* Cost Distribution */}
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h3 className="text-xl font-semibold text-white mb-6">Distribuição de Custos</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={costDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {costDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                  formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Custo']}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Profit Evolution */}
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h3 className="text-xl font-semibold text-white mb-6">Evolução Mensal de Lucro</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Line type="monotone" dataKey="lucro" stroke="#00E5FF" strokeWidth={3} dot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};

const KpiCard = ({ title, value, icon: Icon, color }: any) => (
  <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 flex items-center justify-between hover:bg-gray-750 transition-colors">
    <div>
      <p className="text-gray-400 text-sm font-medium mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-white">{value}</h3>
    </div>
    <div className={`p-3 rounded-lg bg-gray-700/50 ${color}`}>
      <Icon size={24} />
    </div>
  </div>
);
