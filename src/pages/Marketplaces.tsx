import React, { useState } from 'react';
import { useDataStore } from '../store/dataStore';
import { useForm } from 'react-hook-form';
import { Plus, Trash2, Edit2, X, ShoppingBag } from 'lucide-react';

export const Marketplaces = () => {
  const { marketplaces, addMarketplace, updateMarketplace, deleteMarketplace } = useDataStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { register, handleSubmit, reset, setValue } = useForm();

  const openModal = (marketplace?: any) => {
    if (marketplace) {
      setEditingId(marketplace.id);
      setValue('name', marketplace.name);
      setValue('fee_percent', marketplace.fee_percent);
      setValue('fee_fixed', marketplace.fee_fixed);
      setValue('notes', marketplace.notes);
    } else {
      setEditingId(null);
      reset();
    }
    setIsModalOpen(true);
  };

  const onSubmit = async (data: any) => {
    try {
      const payload = {
        name: data.name,
        fee_percent: Number(data.fee_percent),
        fee_fixed: Number(data.fee_fixed),
        notes: data.notes
      };

      if (editingId) {
        await updateMarketplace(editingId, payload);
      } else {
        await addMarketplace(payload);
      }
      setIsModalOpen(false);
      reset();
    } catch (error) {
      console.error(error);
      alert('Erro ao salvar marketplace');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este marketplace?')) {
      await deleteMarketplace(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Marketplaces</h1>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-black font-bold py-2 px-4 rounded-lg transition-colors"
        >
          <Plus size={20} />
          Novo Marketplace
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {marketplaces.map((marketplace) => (
          <div key={marketplace.id} className="bg-gray-800 rounded-xl border border-gray-700 p-6 hover:border-cyan-500/50 transition-colors">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-gray-700 rounded-lg text-cyan-400">
                <ShoppingBag size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{marketplace.name}</h3>
                <p className="text-gray-400 text-sm">Taxas configuradas</p>
              </div>
            </div>
            
            <div className="space-y-2 text-sm text-gray-300 mb-6">
              <div className="flex justify-between">
                <span>Comissão (%):</span>
                <span className="font-medium text-white">{marketplace.fee_percent}%</span>
              </div>
              <div className="flex justify-between">
                <span>Taxa Fixa:</span>
                <span className="font-medium text-white">R$ {marketplace.fee_fixed.toFixed(2)}</span>
              </div>
              {marketplace.notes && (
                <div className="pt-2 border-t border-gray-700 mt-2">
                  <p className="text-xs text-gray-500">{marketplace.notes}</p>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => openModal(marketplace)}
                className="flex-1 flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg transition-colors"
              >
                <Edit2 size={16} /> Editar
              </button>
              <button
                onClick={() => handleDelete(marketplace.id)}
                className="flex items-center justify-center px-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">
                {editingId ? 'Editar Marketplace' : 'Novo Marketplace'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Nome</label>
                <input {...register('name', { required: true })} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-cyan-400 focus:outline-none" placeholder="Ex: Shopee, Mercado Livre" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Comissão (%)</label>
                  <input type="number" step="0.01" {...register('fee_percent')} defaultValue={0} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-cyan-400 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Taxa Fixa (R$)</label>
                  <input type="number" step="0.01" {...register('fee_fixed')} defaultValue={0} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-cyan-400 focus:outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Observações</label>
                <textarea {...register('notes')} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-cyan-400 focus:outline-none" rows={3} />
              </div>

              <button
                type="submit"
                className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-bold py-3 rounded-lg transition-colors"
              >
                Salvar
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
