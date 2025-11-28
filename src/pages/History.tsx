import { useEffect, useState } from 'react';
import { useDataStore } from '../store/dataStore';
import { Trash2, FileText, Search, Eye, X } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Print } from '../types';
import logo from '../assets/logo.png';

export const History = () => {
  const { prints, filaments, marketplaces, fetchData, deletePrint } = useDataStore();
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

  const getFilamentName = (filamentId: string) => {
    const filament = filaments.find(f => f.id === filamentId);
    if (!filament) return 'Filamento não encontrado';
    return `${filament.name} (${filament.brand || 'Sem marca'})`;
  };

  const getMarketplaceName = (marketplaceId: string) => {
    const mp = marketplaces.find(m => m.id === marketplaceId);
    return mp ? mp.name : 'Venda Direta';
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    const logoImg = new Image();
    logoImg.src = logo;

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

      doc.save('historico_impressoes.pdf');
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Histórico</h1>
        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar peça..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray paup-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
          <button
            onClick={exportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded-lg text-white font-medium transition"
          >
            <FileText size={20} />
            Exportar PDF
          </button>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredPrints.length === 0 ? (
          <p className="text-gray-400 text-center py-12">Nenhuma impressão encontrada.</p>
        ) : (
          filteredPrints.map(print => (
            <div key={print.id} className="bg-gray-800 rounded-xl border border-gray-700 p-6 hover:border-cyan-500 transition">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white">{print.name}</h3>
                  <p className="text-sm text-gray-400">
                    {new Date(print.print_date).toLocaleDateString('pt-BR')}
                  </p>
                  <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
                    <div>
                      <span className="text-gray-400">Custo Total:</span>
                      <p className="text-white font-medium">R$ {print.total_cost?.toFixed(2)}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Preço Venda:</span>
                      <p className="text-white font-medium">R$ {print.sale_price?.toFixed(2)}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Lucro:</span>
                      <p className="text-green-400 font-bold">R$ {print.profit?.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => openDetails(print)}
                    className="p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
                  >
                    <Eye className="text-cyan-400" size={20} />
                  </button>
                  <button
                    onClick={() => handleDelete(print.id)}
                    className="p-3 bg-red-900/50 hover:bg-red-900 rounded-lg transition"
                  >
                    <Trash2 className="text-red-400" size={20} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL DE DETALHES — LINDO, COMPLETO E PROFISSIONAL */}
      {selectedPrint && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl max-w-4xl w-full max-h-screen overflow-y-auto border border-cyan-500/30 shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b border-gray-700">
              <h2 className="text-3xl font-bold text-white">Detalhes da Impressão</h2>
              <button onClick={closeDetails} className="text-gray-400 hover:text-white transition">
                <X size={32} />
              </button>
            </div>

            <div className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <p className="text-sm text-cyan-400 font-medium">Nome da Peça</p>
                  <p className="text-2xl font-bold text-white">{selectedPrint.name}</p>
                </div>
                <div>
                  <p className="text-sm text-cyan-400 font-medium">Data da Impressão</p>
                  <p className="text-2xl font-bold text-white">
                    {new Date(selectedPrint.print_date).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>

              {selectedPrint.description && (
                <div>
                  <p className="text-sm text-cyan-400 font-medium mb-2">Descrição</p>
                  <p className="text-gray-300 bg-gray-800/50 p-4 rounded-lg border border-gray-700 leading-relaxed">
                    {selectedPrint.description}
                  </p>
                </div>
              )}

              <div>
                <p className="text-sm text-cyan-400 font-medium mb-3">Filamentos Utilizados</p>
                <div className="space-y-3">
                  {selectedPrint.filaments_used?.map((f, i) => (
                    <div key={i} className="bg-gray-800/70 rounded-xl p-4 border border-gray-700">
                      <p className="text-white font-semibold">
                        {getFilamentName(f.filament_id)}
                      </p>
                      <p className="text-sm text-gray-400">
                        {(f as any).weight_g || (f as any).weight || 0}g — Custo: R$ {f.cost?.toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm text-cyan-400 font-medium mb-3">Detalhamento de Custos</p>
                <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700 space-y-3">
                  <div className="flex justify-between text-gray-300">
                    <span>Custo Filamento</span>
                    <span className="font-medium">R$ {selectedPrint.cost_filament?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>Energia ({selectedPrint.print_time_minutes} min)</span>
                    <span className="font-medium">R$ {selectedPrint.cost_energy?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>Depreciação</span>
                    <span className="font-medium">R$ {selectedPrint.cost_depreciation?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>Custos Extras</span>
                    <span className="font-medium">R$ {selectedPrint.cost_additional?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-300 border-t border-gray-600 pt-3">
                    <span>Taxas Marketplace</span>
                    <span className="font-medium">R$ {selectedPrint.marketplace_fee?.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div className="bg-red-900/30 border border-red-500/50 rounded-xl p-6 text-center">
                  <p className="text-sm text-red-400">Custo Total</p>
                  <p className="text-3xl font-bold text-red-400">R$ {selectedPrint.total_cost?.toFixed(2)}</p>
                </div>
                <div className="bg-cyan-900/30 border border-cyan-500/50 rounded-xl p-6 text-center">
                  <p className="text-sm text-cyan-400">Preço de Venda</p>
                  <p className="text-3xl font-bold text-cyan-400">R$ {selectedPrint.sale_price?.toFixed(2)}</p>
                </div>
                <div className="bg-green-900/30 border border-green-500/50 rounded-xl p-6 text-center">
                  <p className="text-sm text-green-400">Lucro Líquido</p>
                  <p className="text-3xl font-bold text-green-400">R$ {selectedPrint.profit?.toFixed(2)}</p>
                </div>
              </div>

              <div className="text-center">
                <span className="text-xs text-gray-500">
                  Canal de venda: <span className="text-cyan-400 font-medium">
                    {getMarketplaceName(selectedPrint.marketplace_id || '')}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};