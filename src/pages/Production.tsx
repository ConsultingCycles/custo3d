import React, { useEffect } from 'react';
import { useDataStore } from '../store/dataStore';
import { useAuthStore } from '../store/authStore';
import { useForm, useFieldArray } from 'react-hook-form';
import { Calculator, Save, Plus, Trash2, Printer as PrinterIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Production = () => {
  const { filaments, printers, products, registerProduction, fetchData } = useDataStore();
  const { config } = useAuthStore();
  const navigate = useNavigate();
  
  const { register, control, handleSubmit, watch } = useForm({
    defaultValues: {
      product_id: '',
      printer_id: '',
      filaments_used: [{ filament_id: '', material_weight_g: 0 }],
      print_time_hours: 0,
      print_time_minutes: 0,
      quantity_produced: 1,
      cost_additional: 0,
    }
  });

  const { fields, append, remove } = useFieldArray({ control, name: "filaments_used" });

  useEffect(() => { fetchData(); }, [fetchData]);

  // Cálculos em Tempo Real
  const formValues = watch();
  const selectedPrinter = printers.find(p => p.id === formValues.printer_id);
  const totalTimeHours = Number(formValues.print_time_hours) + (Number(formValues.print_time_minutes) / 60);
  
  // 1. Custo Filamento
  let costFilament = 0;
  formValues.filaments_used?.forEach(item => {
    const f = filaments.find(fil => fil.id === item.filament_id);
    if (f && item.material_weight_g) {
      costFilament += (Number(item.material_weight_g) * (f.roll_price / f.roll_weight_g));
    }
  });

  // 2. Custo Energia (Usa a potência da impressora selecionada ou config global)
  const powerW = selectedPrinter?.power_watts || config?.potencia_impressora || 250;
  const energyRate = config?.tarifa_energia || 0.75;
  const costEnergy = (powerW * totalTimeHours / 1000) * energyRate;

  // 3. Depreciação (Específica da impressora)
  const depreciationRate = selectedPrinter 
    ? (selectedPrinter.purchase_price / selectedPrinter.lifespan_hours) 
    : (config?.custo_hora_impressora || 0); // Fallback
  const costDepreciation = totalTimeHours * depreciationRate;

  const costAdditional = Number(formValues.cost_additional) || 0;
  const totalBatchCost = costFilament + costEnergy + costDepreciation + costAdditional;
  const quantity = Number(formValues.quantity_produced) || 1;
  const unitCost = totalBatchCost / quantity;

  const onSubmit = async (data: any) => {
    try {
      const filamentsData = data.filaments_used.map((item: any) => {
        const f = filaments.find(fil => fil.id === item.filament_id);
        const cost = f ? (item.material_weight_g * (f.roll_price / f.roll_weight_g)) : 0;
        return { ...item, cost };
      }).filter((i: any) => i.filament_id && i.material_weight_g > 0);

      await registerProduction({
        product_id: data.product_id,
        printer_id: data.printer_id,
        print_date: new Date().toISOString(),
        print_time_minutes: (Number(data.print_time_hours) * 60) + Number(data.print_time_minutes),
        quantity_produced: Number(data.quantity_produced),
        filaments_used: filamentsData,
        cost_filament_total: costFilament,
        cost_energy: costEnergy,
        cost_depreciation: costDepreciation,
        cost_additional: Number(data.cost_additional),
        unit_cost_final: unitCost,
        status: 'completed',
        energy_rate: energyRate,
        printer_power_w: powerW
      });

      alert('Produção registrada! Estoque atualizado.');
      navigate('/products');
    } catch (error) {
      console.error(error);
      alert('Erro ao registrar produção.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-white flex items-center gap-3">
        <PrinterIcon className="text-cyan-400" /> Registrar Produção
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Seleção Básica */}
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 space-y-4">
            <h2 className="text-xl font-semibold text-white mb-4">O que foi produzido?</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Impressora Utilizada</label>
                <select {...register('printer_id', { required: true })} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white">
                  <option value="">Selecione a máquina...</option>
                  {printers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Produto Fabricado</label>
                <select {...register('product_id', { required: true })} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white">
                  <option value="">Selecione do catálogo...</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Quantidade Produzida</label>
                <input type="number" {...register('quantity_produced', { required: true, min: 1 })} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Custos Extras (R$)</label>
                <input type="number" step="0.01" {...register('cost_additional')} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white" />
              </div>
            </div>
          </div>

          {/* Materiais e Tempo */}
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Calculator size={20} className="text-cyan-400" /> Material e Tempo
            </h2>
            
            <div className="space-y-3 mb-6">
              <label className="block text-sm text-gray-400">Filamentos</label>
              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-4 items-end bg-gray-700/30 p-2 rounded-lg">
                  <div className="flex-1">
                    <select {...register(`filaments_used.${index}.filament_id`, { required: true })} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white">
                      <option value="">Filamento...</option>
                      {filaments.map(f => <option key={f.id} value={f.id}>{f.name} ({f.brand})</option>)}
                    </select>
                  </div>
                  <div className="w-24">
                    <input type="number" placeholder="g" {...register(`filaments_used.${index}.material_weight_g`, { required: true })} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white" />
                  </div>
                  <button type="button" onClick={() => remove(index)} className="p-2 text-red-400 hover:bg-red-500/10 rounded"><Trash2 size={18} /></button>
                </div>
              ))}
              <button type="button" onClick={() => append({ filament_id: '', material_weight_g: 0 })} className="text-sm text-cyan-400 flex items-center gap-1"><Plus size={16} /> Adicionar cor</button>
            </div>

            <div className="flex gap-4 border-t border-gray-700 pt-4">
              <div className="flex-1">
                <label className="block text-sm text-gray-400">Horas</label>
                <input type="number" {...register('print_time_hours')} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white" />
              </div>
              <div className="flex-1">
                <label className="block text-sm text-gray-400">Minutos</label>
                <input type="number" {...register('print_time_minutes')} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Resumo de Custos */}
        <div className="space-y-6">
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 sticky top-6">
            <h2 className="text-xl font-bold text-white mb-6">Custos do Lote</h2>
            <div className="space-y-3 mb-6 text-sm">
              <div className="flex justify-between"><span className="text-gray-400">Filamento</span><span className="text-white">R$ {costFilament.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Energia</span><span className="text-white">R$ {costEnergy.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Depreciação</span><span className="text-white">R$ {costDepreciation.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Extras</span><span className="text-white">R$ {costAdditional.toFixed(2)}</span></div>
              <div className="border-t border-gray-600 my-2 pt-2 flex justify-between font-bold text-lg">
                <span className="text-white">Total Lote</span>
                <span className="text-cyan-400">R$ {totalBatchCost.toFixed(2)}</span>
              </div>
            </div>

            <div className="bg-cyan-900/30 border border-cyan-500/30 p-4 rounded-lg mb-6 text-center">
              <span className="block text-gray-400 text-xs uppercase tracking-wider">Custo Unitário Final</span>
              <span className="block text-3xl font-bold text-white mt-1">R$ {unitCost.toFixed(2)}</span>
            </div>

            <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg flex justify-center items-center gap-2">
              <Save size={20} /> Registrar no Estoque
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};