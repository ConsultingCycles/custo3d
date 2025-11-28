import { useForm } from 'react-hook-form';
import { useAuthStore } from '../store/authStore';
import { useDataStore } from '../store/dataStore';
import { Save } from 'lucide-react';

export const Settings = () => {
  const { config } = useAuthStore();
  const { updateConfig } = useDataStore();
  
  const { register, handleSubmit, formState: { isSubmitting } } = useForm({
    defaultValues: {
      tarifa_energia: config?.tarifa_energia || 0.75,
      margem_padrao: config?.margem_padrao || 30,
      moeda: config?.moeda || 'BRL'
    }
  });

  const onSubmit = async (data: any) => {
    try {
      await updateConfig({
        tarifa_energia: Number(data.tarifa_energia),
        margem_padrao: Number(data.margem_padrao),
        moeda: data.moeda
      });
      alert('Configurações salvas com sucesso!');
    } catch (error) {
      console.error(error);
      alert('Erro ao salvar configurações');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-8">Configurações Gerais</h1>
      
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Tarifa de Energia (R$/kWh)
              </label>
              <input
                type="number"
                step="0.01"
                {...register('tarifa_energia')}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-cyan-400 focus:outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">Consulte sua conta de luz</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Margem de Lucro Padrão (%)
              </label>
              <input
                type="number"
                {...register('margem_padrao')}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-cyan-400 focus:outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">Margem sugerida inicial para novos cálculos</p>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-700">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-black font-bold py-2 px-6 rounded-lg transition-colors disabled:opacity-50"
            >
              <Save size={20} />
              {isSubmitting ? 'Salvando...' : 'Salvar Configurações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};