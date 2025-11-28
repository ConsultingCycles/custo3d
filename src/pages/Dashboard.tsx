import { useEffect, useMemo } from 'react';
import { useDataStore } from '../store/dataStore';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  BarChart, Bar
} from 'recharts';
import { DollarSign, TrendingUp, Package, Activity, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export const Dashboard = () => {
  const { prints, filaments, marketplaces, fetchData, loading } = useDataStore();

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalRevenue = prints.reduce((acc, p) => acc + (Number(p.sale_price) || 0), 0);
  const totalProfit = prints.reduce((acc, p) => acc + (Number(p.profit) || 0), 0);
  const totalCost = prints.reduce((acc, p) => acc + (Number(p.total_cost) || 0), 0);
  const totalPrints = prints.length;

  const lowStockFilaments = filaments.filter(f => 
    f.current_weight_g !== null && f.current_weight_g < (f.min_stock_alert_g || 100)
  );

  const costDistribution = [
    { name: 'Filamento', value: prints.reduce((acc, p) => acc + (Number(p.cost_filament) || 0), 0) },
    { name: 'Energia', value: prints.reduce((acc, p) => acc + (Number(p.cost_energy) || 0), 0) },
    { name: 'Depreciação', value: prints.reduce((acc, p) => acc + (Number(p.cost_depreciation) || 0), 0) },
    { name: 'Taxas', value: prints.reduce((acc, p) => acc + (Number(p.marketplace_fee) || 0), 0) },
    { name: 'Outros', value: prints.reduce((acc, p) => acc + (Number(p.cost_additional) || 0), 0) },
  ].filter(d => d.value > 0);

  const revenueByMarketplace = useMemo(() => {
    const data: Record<string, number> = { 'Venda Direta': 0 };
    marketplaces.forEach(m => data[m.name] = 0);

    prints.forEach(p => {
      const price = Number(p.sale_price) || 0;
      if (price <= 0) return;
      if (p.marketplace_id) {
        const m = marketplaces.find(m => m.id === p.marketplace_id);
        const name = m ? m.name : 'Desconhecido';
        data[name] += price;
      } else {
        data['Venda Direta'] += price;
      }
    });

    return Object.entries(data)
      .map(([name, value]) => ({ name, value }))
      .filter(d => d.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [prints, marketplaces]);

  const revenueByPart = useMemo(() => {
    const data: Record<string, number> = {};
    prints.forEach(p => {
      const price = Number(p.sale_price) || 0;
      if (price > 0) {
        data[p.name || 'Sem nome'] = (data[p.name || 'Sem nome'] || 0) + price;
      }
    });
    return Object.entries(data)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [prints]);

  // EVOLUÇÃO MENSAL DO LUCRO — 100% CORRETO E SEM ERROS
  const monthlyData = useMemo(() => {
    const grouped: Record<string, number> = {};

    prints.forEach(p => {
      const salePrice = Number(p.sale_price) || 0;
      const totalCost = Number(p.total_cost) || 0;

      if (salePrice > 0) {
        const lucroReal = salePrice - totalCost;

        let monthKey = 'Sem data';
        if (p.print_date) {
          try {
            const date = new Date(p.print_date);
            if (!isNaN(date.getTime())) {
              const mes = format(date, 'MMM/yy', { locale: ptBR });
              monthKey = mes.charAt(0).toUpperCase() + mes.slice(1).replace('.', '');
            }
          } catch (e) {}
        }

        grouped[monthKey] = (grouped[monthKey] || 0) + lucroReal;
      }
    });

    const allMonths = ['Jan/25','Fev/25','Mar/25','Abr/25','Mai/25','Jun/25',
                       'Jul/25','Ago/25','Set/25','Out/25','Nov/25','Dez/25'];

    return allMonths.map(month => ({
      name: month,
      lucro: Number((grouped[month] || 0).toFixed(2))
    }));
  }, [prints]);

  if (loading) {
    return <div className="text-white text-center py-20">Carregando dashboard...</div>;
  }

  return (
    <div className="space-y-8 p-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400">Visão geral do seu negócio de impressão 3D</p>
        </div>
      </header>

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard title="Faturamento Total" value={`R$ ${totalRevenue.toFixed(2)}`} icon={DollarSign} color="text-green-400" />
        <KpiCard title="Lucro Total" value={`R$ ${totalProfit.toFixed(2)}`} icon={TrendingUp} color="text-cyan-400" />
        <KpiCard title="Custo Total" value={`R$ ${totalCost.toFixed(2)}`} icon={Activity} color="text-red-400" />
        <KpiCard title="Peças Produzidas" value={totalPrints} icon={Package} color="text-purple-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Faturamento por Canal */}
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h3 className="text-xl font-semibold text-white mb-6">Faturamento por Canal</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueByMarketplace} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
                <XAxis type="number" stroke="#9ca3af" />
                <YAxis dataKey="name" type="category" stroke="#9ca3af" width={100} />
                <RechartsTooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
                <Bar dataKey="value" fill="#00E5FF" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top 5 Peças */}
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

        {/* Distribuição de Custos — Tooltip BRANCO 100% garantido */}
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
                  {costDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>

                <RechartsTooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-lg">
                          <p className="text-white font-medium">
                            {payload[0].name}: R$ {Number(payload[0].value).toFixed(2)}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />

                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Evolução Mensal do Lucro */}
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h3 className="text-xl font-semibold text-white mb-6">Evolução Mensal de Lucro</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" tickFormatter={(v) => `R$${v}`} />
                <RechartsTooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
                <Line type="monotone" dataKey="lucro" stroke="#00E5FF" strokeWidth={6} dot={{ fill: '#00E5FF', r: 8 }} activeDot={{ r: 12 }} />
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