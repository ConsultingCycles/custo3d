import React, { useState, useEffect } from 'react';
import { useDataStore } from '../store/dataStore';
import { ShoppingCart, Plus, Trash2, Save, Hash, ArrowLeft } from 'lucide-react';
import { useNavigate, useParams, Link } from 'react-router-dom';

export const NewOrder = () => {
  const { products, marketplaces, createOrder, updateOrder, orders, fetchData } = useDataStore();
  const navigate = useNavigate();
  const { id } = useParams(); // Pega o ID da URL se for edição

  const [customer, setCustomer] = useState('');
  const [marketplaceId, setMarketplaceId] = useState('');
  const [externalOrderId, setExternalOrderId] = useState('');
  const [cart, setCart] = useState<{ productId: string; qty: number; price: number }[]>([]);
  
  const [selectedProdId, setSelectedProdId] = useState('');
  const [qty, setQty] = useState(1);
  const [price, setPrice] = useState(0);

  // Carrega dados iniciais e verifica se é edição
  useEffect(() => {
    const init = async () => {
      await fetchData();
      
      // Se tiver ID, estamos editando
      if (id) {
        const orderToEdit = useDataStore.getState().orders.find(o => o.id === id);
        if (orderToEdit) {
          setCustomer(orderToEdit.customer_name);
          setMarketplaceId(orderToEdit.marketplace_id || '');
          setExternalOrderId(orderToEdit.marketplace_order_id || '');
          
          // Popula carrinho
          if (orderToEdit.items) {
            const items = orderToEdit.items.map(item => ({
              productId: item.product_id,
              qty: item.quantity,
              price: item.unit_price
            }));
            setCart(items);
          }
        }
      }
    };
    init();
  }, [fetchData, id]);

  useEffect(() => {
    const p = products.find(prod => prod.id === selectedProdId);
    if (p) setPrice(p.suggested_price || 0);
  }, [selectedProdId, products]);

  const addToCart = () => {
    if (!selectedProdId || qty <= 0) return;
    // Se produto já existe, atualiza
    const exists = cart.findIndex(i => i.productId === selectedProdId);
    if (exists >= 0) {
      const newCart = [...cart];
      newCart[exists].qty += qty;
      setCart(newCart);
    } else {
      setCart([...cart, { productId: selectedProdId, qty, price }]);
    }
    
    setSelectedProdId('');
    setQty(1);
    setPrice(0);
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const calculateTotals = () => {
    const totalRevenue = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
    const mkt = marketplaces.find(m => m.id === marketplaceId);
    const fee = mkt ? (totalRevenue * (mkt.fee_percent / 100)) + mkt.fee_fixed : 0;
    
    let totalCost = 0;
    cart.forEach(item => {
      const p = products.find(prod => prod.id === item.productId);
      if (p) totalCost += (p.average_cost * item.qty);
    });

    return { totalRevenue, fee, totalCost, profit: totalRevenue - fee - totalCost };
  };

  const handleSubmit = async () => {
    if (!customer || cart.length === 0) return alert('Preencha o cliente e adicione itens.');
    
    const totals = calculateTotals();
    const orderItems = cart.map(item => {
      const p = products.find(prod => prod.id === item.productId);
      return {
        product_id: item.productId,
        quantity: item.qty,
        unit_price: item.price,
        unit_cost_at_sale: p?.average_cost || 0
      };
    });

    const payload = {
      customer_name: customer,
      marketplace_id: marketplaceId || null,
      marketplace_order_id: externalOrderId,
      total_price: totals.totalRevenue,
      marketplace_fee: totals.fee,
      net_profit: totals.profit,
      // Se for edição, mantém a data original, senão usa agora
      order_date: id ? undefined : new Date().toISOString(), 
      status: 'draft' as const
    };

    try {
      if (id) {
        await updateOrder(id, payload, orderItems);
        alert('Pedido atualizado!');
      } else {
        await createOrder(payload, orderItems);
        alert('Pedido criado!');
      }
      navigate('/orders');
    } catch (e) {
      console.error(e);
      alert('Erro ao salvar.');
    }
  };

  const totals = calculateTotals();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/orders" className="bg-gray-800 p-2 rounded-lg text-gray-400 hover:text-white">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-3xl font-bold text-white">
          {id ? 'Editar Pedido' : 'Novo Pedido'}
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h3 className="text-lg font-bold text-white mb-4">Dados da Venda</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Nome do Cliente</label>
              <input 
                value={customer} 
                onChange={e => setCustomer(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white" 
                placeholder="Ex: João da Silva"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Canal de Venda</label>
                <select 
                  value={marketplaceId} 
                  onChange={e => setMarketplaceId(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                >
                  <option value="">Venda Direta</option>
                  {marketplaces.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Nº Pedido (Opcional)</label>
                <div className="relative">
                  <Hash className="absolute left-3 top-2.5 text-gray-500" size={16} />
                  <input 
                    value={externalOrderId} 
                    onChange={e => setExternalOrderId(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-9 pr-3 py-2 text-white" 
                    placeholder="Ex: Shopee #123"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h3 className="text-lg font-bold text-white mb-4">Adicionar Item</h3>
          <div className="space-y-3">
            <select 
              value={selectedProdId} 
              onChange={e => setSelectedProdId(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
            >
              <option value="">Selecione um produto...</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} (Estoque: {p.stock_quantity})
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <input 
                type="number" 
                value={qty} 
                onChange={e => setQty(Number(e.target.value))}
                className="w-20 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm" 
                placeholder="Qtd"
              />
              <input 
                type="number" 
                value={price} 
                onChange={e => setPrice(Number(e.target.value))}
                className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm" 
                placeholder="Preço Unit (R$)"
              />
              <button onClick={addToCart} className="bg-cyan-600 hover:bg-cyan-700 text-white p-2 rounded-lg">
                <Plus size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <table className="w-full text-left text-sm text-gray-300">
          <thead className="bg-gray-700 text-gray-100">
            <tr>
              <th className="p-4">Produto</th>
              <th className="p-4">Qtd</th>
              <th className="p-4">Preço Unit.</th>
              <th className="p-4">Subtotal</th>
              <th className="p-4 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {cart.map((item, index) => {
              const p = products.find(prod => prod.id === item.productId);
              return (
                <tr key={index}>
                  <td className="p-4">{p?.name}</td>
                  <td className="p-4">{item.qty}</td>
                  <td className="p-4">R$ {item.price.toFixed(2)}</td>
                  <td className="p-4 text-white font-medium">R$ {(item.price * item.qty).toFixed(2)}</td>
                  <td className="p-4">
                    <button onClick={() => removeFromCart(index)} className="text-red-400 hover:text-red-300">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
            {cart.length === 0 && (
              <tr><td colSpan={5} className="p-8 text-center text-gray-500">Carrinho vazio</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end">
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 w-full md:w-80 space-y-3">
          <div className="flex justify-between text-sm text-gray-400">
            <span>Subtotal</span>
            <span>R$ {totals.totalRevenue.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-red-400">
            <span>Taxas</span>
            <span>- R$ {totals.fee.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-400">
            <span>Custo Prod.</span>
            <span>- R$ {totals.totalCost.toFixed(2)}</span>
          </div>
          <div className="border-t border-gray-600 pt-3 flex justify-between font-bold text-lg text-white">
            <span>Lucro Previsto</span>
            <span className={totals.profit >= 0 ? 'text-green-400' : 'text-red-400'}>
              R$ {totals.profit.toFixed(2)}
            </span>
          </div>
          
          <button onClick={handleSubmit} className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2">
            <Save size={20} /> {id ? 'Atualizar Pedido' : 'Criar Pedido'}
          </button>
        </div>
      </div>
    </div>
  );
};