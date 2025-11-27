import React, { useEffect, useState } from 'react';
import { useDataStore } from '../store/dataStore';
import { Trash2, FileText, Search, Eye, X } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Print } from '../types';

export const History = () => {
  const { prints, fetchData, deletePrint } = useDataStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPrint, setSelectedPrint] = useState<Print | null>(null);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredPrints = prints.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este registro?')) {
      await deletePrint(id);
    }
  };

  const openDetails = (print: Print) => {
    setSelectedPrint(print);
  };

  const closeDetails = () => {
    setSelectedPrint(null);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    
    // Add Logo
    const logoImg = new Image();
    logoImg.src = '/assets/logo.png';
    
    logoImg.onload = () => {
      doc.addImage(logoImg, 'PNG', 20, 10, 30, 12);
      
      doc.setFontSize(18);
      doc.setTextColor(30, 136, 229);
      doc.text('Relatório de Impressões', 190, 20, { align: 'right' });
      
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Gerado em: ${new Date().toLocaleDateString()}`, 190, 26, { align: 'right' });

      const tableData = filteredPrints.map(p => [
        new Date(p.print_date).toLocaleDateString(),
        p.name,
        `R$ ${p.total_cost?.toFixed(2)}`,
        `R$ ${p.sale_price?.toFixed(2)}`,
        `R$ ${p.profit?.toFixed(2)}`
      ]);

      autoTable(doc, {
        head: [['Data', 'Nome', 'Custo', 'Venda', 'Lucro']],
        body: tableData,
        startY: 35,
        headStyles: { fillColor: [30, 136, 229] },
        alternateRowStyles: { fillColor: [245, 245, 245] },
      });

      doc.save('historico-impressoes.pdf');
    };

    logoImg.onerror = () => {
      // Fallback without logo
      doc.text('Relatório de Impressões', 20, 20);
      const tableData = filteredPrints.map(p => [
        new Date(p.print_date).toLocaleDateString(),
        p.name,
        `R$ ${p.total_cost?.toFixed(2)}`,
        `R$ ${p.sale_price?.toFixed(2)}`,
        `R$ ${p.profit?.toFixed(2)}`
      ]);
      autoTable(doc, {
        head: [['Data', 'Nome', 'Custo', 'Venda', 'Lucro']],
        body: tableData,
        startY: 30,
      });
      doc.save('historico-impressoes.pdf');
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold text-white">Histórico</h1>
        
        <div className="flex gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white focus:ring-2 focus:ring-cyan-400 focus:outline-none"
            />
          </div>
          <button
            onClick={exportPDF}
            className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-700 flex items-center gap-2"
          >
            <FileText size={20} /> Exportar PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPrints.map((print) => (
          <div key={print.id} className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden hover:border-cyan-500/50 transition-colors">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white">{print.name}</h3>
                  <p className="text-gray-400 text-sm">{new Date(print.print_date).toLocaleDateString()}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-bold ${
                  (print.profit || 0) > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {(print.real_margin || 0).toFixed(1)}%
                </span>
              </div>

              <div className="space-y-2 text-sm text-gray-300 mb-6">
                <div className="flex justify-between">
                  <span>Custo Total:</span>
                  <span className="font-medium text-white">R$ {print.total_cost?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Preço Venda:</span>
                  <span className="font-medium text-cyan-400">R$ {print.sale_price?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-gray-700 pt-2 mt-2">
                  <span>Lucro:</span>
                  <span className="font-bold text-green-400">R$ {print.profit?.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => openDetails(print)}
                  className="flex-1 flex items-center justify-center gap-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 py-2 rounded-lg transition-colors"
                >
                  <Eye size={16} /> Detalhes
                </button>
                <button
                  onClick={() => handleDelete(print.id)}
                  className="flex items-center justify-center px-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Details Modal */}
      {selectedPrint && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Detalhes da Impressão</h2>
              <button onClick={closeDetails} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400">Nome</label>
                  <div className="text-white text-lg">{selectedPrint.name}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400">Data</label>
                  <div className="text-white text-lg">{new Date(selectedPrint.print_date).toLocaleDateString()}</div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-400">Descrição</label>
                  <div className="text-white">{selectedPrint.description || '-'}</div>
                </div>
              </div>

              {/* Filaments Used */}
              <div className="bg-gray-700/30 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-3">Filamentos Utilizados</h3>
                {selectedPrint.filaments_used && selectedPrint.filaments_used.length > 0 ? (
                  <div className="space-y-2">
                    {selectedPrint.filaments_used.map((usage, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-gray-300">Filamento ID: {usage.filament_id}</span>
                        <span className="text-white">{usage.material_weight_g}g (R$ {usage.cost.toFixed(2)})</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-400 text-sm">Nenhum filamento registrado (Legado)</div>
                )}
              </div>

              {/* Costs Breakdown */}
              <div className="bg-gray-700/30 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-3">Detalhamento de Custos</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Custo Filamento</span>
                    <span className="text-white">R$ {selectedPrint.cost_filament?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Energia ({selectedPrint.print_time_minutes} min)</span>
                    <span className="text-white">R$ {selectedPrint.cost_energy?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Depreciação</span>
                    <span className="text-white">R$ {selectedPrint.cost_depreciation?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Custos Extras</span>
                    <span className="text-white">R$ {selectedPrint.cost_additional?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-600 pt-2">
                    <span className="text-gray-400">Taxas Marketplace</span>
                    <span className="text-white">R$ {selectedPrint.marketplace_fee?.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Financial Summary */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-gray-700/50 p-3 rounded-lg">
                  <div className="text-sm text-gray-400">Custo Total</div>
                  <div className="text-xl font-bold text-red-400">R$ {selectedPrint.total_cost?.toFixed(2)}</div>
                </div>
                <div className="bg-gray-700/50 p-3 rounded-lg">
                  <div className="text-sm text-gray-400">Preço Venda</div>
                  <div className="text-xl font-bold text-cyan-400">R$ {selectedPrint.sale_price?.toFixed(2)}</div>
                </div>
                <div className="bg-gray-700/50 p-3 rounded-lg">
                  <div className="text-sm text-gray-400">Lucro</div>
                  <div className="text-xl font-bold text-green-400">R$ {selectedPrint.profit?.toFixed(2)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
