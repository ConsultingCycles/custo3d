import React, { useEffect, useState } from 'react';
import { useDataStore } from '../store/dataStore';
import { useAuthStore } from '../store/authStore';
import { useForm, useFieldArray } from 'react-hook-form';
import { Calculator, Save, FileText, Plus, Trash2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png'; // ← ADICIONAR ESTA LINHA

export const NewPrint = ({ isSimulation = false }: { isSimulation?: boolean }) => {
  const { filaments, marketplaces, addPrint, fetchData } = useDataStore();
  const { config } = useAuthStore();
  const navigate = useNavigate();
  const { register, control, handleSubmit, watch, setValue } = useForm({
    defaultValues: {
      filaments_used: [{ filament_id: '', material_weight_g: 0 }],
      name: '',
      description: '',
      print_time_hours: 0,
      print_time_minutes: 0,
      marketplace_id: '',
      cost_additional: 0,
      desired_margin: config?.margem_padrao || 30
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "filaments_used"
  });

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Watch fields for calculation
  const filamentsUsed = watch('filaments_used');
  const hours = Number(watch('print_time_hours') || 0);
  const minutes = Number(watch('print_time_minutes') || 0);
  const selectedMarketplaceId = watch('marketplace_id');
  const additionalCost = Number(watch('cost_additional') || 0);
  const desiredMargin = Number(watch('desired_margin') || config?.margem_padrao || 30);

  // Calculations
  const selectedMarketplace = marketplaces.find(m => m.id === selectedMarketplaceId);
  const totalTimeHours = hours + (minutes / 60);
  
  // Calculate total filament cost
  let costFilament = 0;
  let totalWeight = 0;

  filamentsUsed.forEach(item => {
    const filament = filaments.find(f => f.id === item.filament_id);
    const weight = Number(item.material_weight_g || 0);
    if (filament && weight > 0) {
      costFilament += (weight * (filament.roll_price / filament.roll_weight_g));
      totalWeight += weight;
    }
  });
  
  const costEnergy = config 
    ? (config.potencia_impressora * totalTimeHours / 1000) * config.tarifa_energia 
    : 0;

  const costDepreciation = config 
    ? totalTimeHours * config.custo_hora_impressora 
    : 0;

  const baseCost = costFilament + costEnergy + costDepreciation + additionalCost;
  
  // Price Calculation
  const priceWithMargin = baseCost * (1 + (desiredMargin / 100));
  
  // Marketplace Fee
  const marketplaceFee = selectedMarketplace 
    ? (priceWithMargin * (selectedMarketplace.fee_percent / 100)) + selectedMarketplace.fee_fixed 
    : 0;

  const finalSuggestedPrice = priceWithMargin + marketplaceFee;
  const totalCost = baseCost + marketplaceFee;
  const profit = finalSuggestedPrice - totalCost;
  const realMargin = finalSuggestedPrice > 0 ? (profit / finalSuggestedPrice) * 100 : 0;

  const onSubmit = async (data: any) => {
    try {
      // Prepare filament usage data
      const filamentsUsageData = data.filaments_used.map((item: any) => {
        const filament = filaments.find(f => f.id === item.filament_id);
        const weight = Number(item.material_weight_g);
        const cost = filament ? (weight * (filament.roll_price / filament.roll_weight_g)) : 0;
        return {
          filament_id: item.filament_id,
          material_weight_g: weight,
          cost: cost
        };
      }).filter((item: any) => item.filament_id && item.material_weight_g > 0);

      if (!isSimulation) {
        await addPrint({
          name: data.name,
          description: data.description,
          print_date: new Date().toISOString(),
          filaments_used: filamentsUsageData,
          print_time_minutes: (Number(data.print_time_hours) * 60) + Number(data.print_time_minutes),
          energy_rate: config?.tarifa_energia || 0,
          printer_power_w: config?.potencia_impressora || 0,
          cost_filament: costFilament,
          cost_energy: costEnergy,
          cost_depreciation: costDepreciation,
          cost_additional: Number(data.cost_additional),
          marketplace_id: data.marketplace_id || null,
          marketplace_fee: marketplaceFee,
          sale_price: finalSuggestedPrice,
          total_cost: totalCost,
          profit: profit,
          real_margin: realMargin,
          image_url: null // TODO: Implement image upload
        });
        alert('Impressão salva com sucesso!');
        navigate('/history');
      } else {
        alert('Simulação concluída! Você pode gerar o PDF agora.');
      }
    } catch (error) {
      console.error(error);
      alert('Erro ao salvar impressão');
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    
    // Add Logo
    const logoImg = new Image();
    logoImg.src = logo;
    
    logoImg.onload = () => {
      // Header
      doc.addImage(logoImg, 'PNG', 20, 10, 40, 15); // Adjust dimensions as needed
      doc.setFontSize(24);
      doc.setTextColor(30, 136, 229); // Azul Tech
      doc.text('Ficha Técnica', 190, 25, { align: 'right' });
      
      // Line separator
      doc.setDrawColor(200, 200, 200);
      doc.line(20, 35, 190, 35);

      // Product Info
      doc.setFontSize(14);
      doc.setTextColor(33, 33, 33);
      doc.text(`Peça: ${watch('name')}`, 20, 50);
      
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Data: ${new Date().toLocaleDateString()}`, 20, 58);
      doc.text(`Descrição: ${watch('description') || '-'}`, 20, 64);

      // Details Box
      doc.setFillColor(245, 245, 245);
      doc.rect(20, 75, 170, 90, 'F');
      
      doc.setFontSize(12);
      doc.setTextColor(33, 33, 33);
      doc.text('Detalhamento de Custos', 30, 90);
      
      let y = 105;
      const addRow = (label: string, value: string) => {
        doc.setFontSize(10);
        doc.setTextColor(80, 80, 80);
        doc.text(label, 30, y);
        doc.setTextColor(33, 33, 33);
        doc.text(value, 180, y, { align: 'right' });
        y += 10;
      };

      addRow('Filamentos (Total)', `R$ ${costFilament.toFixed(2)}`);
      addRow('Energia', `R$ ${costEnergy.toFixed(2)}`);
      addRow('Depreciação', `R$ ${costDepreciation.toFixed(2)}`);
      addRow('Custos Extras', `R$ ${additionalCost.toFixed(2)}`);
      addRow('Taxas Marketplace', `R$ ${marketplaceFee.toFixed(2)}`);
      
      // Totals
      y += 5;
      doc.setDrawColor(200, 200, 200);
      doc.line(30, y, 180, y);
      y += 15;

      doc.setFontSize(14);
      doc.setTextColor(30, 136, 229);
      doc.text('Custo Total', 30, y);
      doc.text(`R$ ${totalCost.toFixed(2)}`, 180, y, { align: 'right' });
      
      y += 15;
      doc.setTextColor(0, 200, 83); // Green
      doc.text('Preço Sugerido', 30, y);
      doc.text(`R$ ${finalSuggestedPrice.toFixed(2)}`, 180, y, { align: 'right' });

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text('Gerado por Custo3D - Seu gerenciador de impressão 3D', 105, 280, { align: 'center' });

      doc.save(`ficha-${watch('name')}.pdf`);
    };
    
    // Fallback if image fails to load immediately (though in local app it should be fast)
    logoImg.onerror = () => {
      // Header without logo
      doc.setFontSize(24);
      doc.setTextColor(30, 136, 229); // Azul Tech
      doc.text('Ficha Técnica', 190, 25, { align: 'right' });
      
      // Line separator
      doc.setDrawColor(200, 200, 200);
      doc.line(20, 35, 190, 35);

      // Product Info
      doc.setFontSize(14);
      doc.setTextColor(33, 33, 33);
      doc.text(`Peça: ${watch('name')}`, 20, 50);
      
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Data: ${new Date().toLocaleDateString()}`, 20, 58);
      doc.text(`Descrição: ${watch('description') || '-'}`, 20, 64);

      // Details Box
      doc.setFillColor(245, 245, 245);
      doc.rect(20, 75, 170, 90, 'F');
      
      doc.setFontSize(12);
      doc.setTextColor(33, 33, 33);
      doc.text('Detalhamento de Custos', 30, 90);
      
      let y = 105;
      const addRow = (label: string, value: string) => {
        doc.setFontSize(10);
        doc.setTextColor(80, 80, 80);
        doc.text(label, 30, y);
        doc.setTextColor(33, 33, 33);
        doc.text(value, 180, y, { align: 'right' });
        y += 10;
      };

      addRow('Filamentos (Total)', `R$ ${costFilament.toFixed(2)}`);
      addRow('Energia', `R$ ${costEnergy.toFixed(2)}`);
      addRow('Depreciação', `R$ ${costDepreciation.toFixed(2)}`);
      addRow('Custos Extras', `R$ ${additionalCost.toFixed(2)}`);
      addRow('Taxas Marketplace', `R$ ${marketplaceFee.toFixed(2)}`);
      
      // Totals
      y += 5;
      doc.setDrawColor(200, 200, 200);
      doc.line(30, y, 180, y);
      y += 15;

      doc.setFontSize(14);
      doc.setTextColor(30, 136, 229);
      doc.text('Custo Total', 30, y);
      doc.text(`R$ ${totalCost.toFixed(2)}`, 180, y, { align: 'right' });
      
      y += 15;
      doc.setTextColor(0, 200, 83); // Green
      doc.text('Preço Sugerido', 30, y);
      doc.text(`R$ ${finalSuggestedPrice.toFixed(2)}`, 180, y, { align: 'right' });

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text('Gerado por Custo3D - Seu gerenciador de impressão 3D', 105, 280, { align: 'center' });

      doc.save(`ficha-${watch('name')}.pdf`);
    };
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-white">Nova Impressão</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Inputs */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Basic Info */}
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <FileText size={20} className="text-cyan-400" /> Dados Básicos
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Nome da Peça</label>
                <input {...register('name', { required: true })} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-cyan-400 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Descrição</label>
                <textarea {...register('description')} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-cyan-400 focus:outline-none" rows={2} />
              </div>
            </div>
          </div>

          {/* Materials & Time */}
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Calculator size={20} className="text-cyan-400" /> Material e Tempo
            </h2>
            
            {/* Dynamic Filament List */}
            <div className="space-y-4 mb-6">
              <label className="block text-sm font-medium text-gray-400">Filamentos Utilizados</label>
              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-4 items-end bg-gray-700/30 p-3 rounded-lg">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">Filamento {index + 1}</label>
                    <select 
                      {...register(`filaments_used.${index}.filament_id` as const, { required: true })} 
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-cyan-400 focus:outline-none text-sm"
                    >
                      <option value="">Selecione...</option>
                      {filaments.map(f => (
                        <option key={f.id} value={f.id}>{f.name} ({f.type})</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-32">
                    <label className="block text-xs text-gray-500 mb-1">Peso (g)</label>
                    <input 
                      type="number" 
                      {...register(`filaments_used.${index}.material_weight_g` as const, { required: true, min: 0 })} 
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-cyan-400 focus:outline-none text-sm" 
                    />
                  </div>
                  {fields.length > 1 && (
                    <button 
                      type="button" 
                      onClick={() => remove(index)}
                      className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => append({ filament_id: '', material_weight_g: 0 })}
                className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
              >
                <Plus size={16} /> Adicionar outro filamento (Multi-color)
              </button>
            </div>

            <div className="flex gap-4 border-t border-gray-700 pt-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-400 mb-1">Horas</label>
                <input type="number" {...register('print_time_hours')} defaultValue={0} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-cyan-400 focus:outline-none" />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-400 mb-1">Minutos</label>
                <input type="number" {...register('print_time_minutes')} defaultValue={0} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-cyan-400 focus:outline-none" />
              </div>
            </div>
          </div>

          {/* Financials */}
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Save size={20} className="text-cyan-400" /> Financeiro
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Marketplace</label>
                <select {...register('marketplace_id')} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-cyan-400 focus:outline-none">
                  <option value="">Venda Direta (Sem taxas)</option>
                  {marketplaces.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Custos Extras (R$)</label>
                <input type="number" step="0.01" {...register('cost_additional')} defaultValue={0} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-cyan-400 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Margem Desejada (%)</label>
                <input type="number" {...register('desired_margin')} defaultValue={config?.margem_padrao || 30} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-cyan-400 focus:outline-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Results */}
        <div className="space-y-6">
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 sticky top-6">
            <h2 className="text-xl font-bold text-white mb-6">Resumo de Custos</h2>
            
            <div className="space-y-3 mb-6">
              <ResultRow label="Filamento" value={costFilament} />
              <ResultRow label="Energia" value={costEnergy} />
              <ResultRow label="Depreciação" value={costDepreciation} />
              <ResultRow label="Extras" value={additionalCost} />
              <div className="border-t border-gray-700 my-2"></div>
              <ResultRow label="Custo Base" value={baseCost} highlight />
              <ResultRow label="Taxas Mkt" value={marketplaceFee} />
              <div className="border-t border-gray-700 my-2"></div>
              <ResultRow label="Custo Total" value={totalCost} color="text-red-400" />
            </div>

            <div className="bg-gray-700/30 p-4 rounded-lg mb-6">
              <div className="text-sm text-gray-400 mb-1">Preço Sugerido de Venda</div>
              <div className="text-3xl font-bold text-cyan-400">R$ {finalSuggestedPrice.toFixed(2)}</div>
              <div className="flex justify-between mt-2 text-sm">
                <span className="text-green-400">Lucro: R$ {profit.toFixed(2)}</span>
                <span className="text-gray-400">Margem: {realMargin.toFixed(1)}%</span>
              </div>
            </div>

            <div className="space-y-3">
              {!isSimulation && (
                <button
                  type="submit"
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Save size={20} /> Salvar Impressão
                </button>
              )}
              
              <button
                type="button"
                onClick={generatePDF}
                className={`w-full ${isSimulation ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-700 hover:bg-gray-600'} text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2`}
              >
                <FileText size={20} /> Gerar Ficha Técnica
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

const ResultRow = ({ label, value, highlight = false, color = 'text-white' }: any) => (
  <div className={`flex justify-between items-center ${highlight ? 'font-bold' : ''}`}>
    <span className="text-gray-400">{label}</span>
    <span className={color}>R$ {value.toFixed(2)}</span>
  </div>
);
