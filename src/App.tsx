import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { ProtectedRoute } from './components/Layout';
import { useAuthStore } from './store/authStore';

// Importação das Páginas
import { Printers } from './pages/Printers';
import { Products } from './pages/Products';
import { Production } from './pages/Production'; // Produção Real (Baixa Estoque)
import { Simulation } from './pages/Simulation'; // Simulador (Antigo NewPrint)
import { Filaments } from './pages/Filaments';
import { Orders } from './pages/Orders';
import { NewOrder } from './pages/NewOrder';
import { Marketplaces } from './pages/Marketplaces';
import { Expenses } from './pages/Expenses';
import { Settings } from './pages/Settings';

function App() {
  const { fetchProfile } = useAuthStore();

  React.useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Dashboard />} />
          
          {/* Cadastros */}
          <Route path="/printers" element={<Printers />} />
          <Route path="/products" element={<Products />} />
          <Route path="/filaments" element={<Filaments />} />
          <Route path="/marketplaces" element={<Marketplaces />} />
          <Route path="/expenses" element={<Expenses />} />
          
          {/* Operacional */}
          <Route path="/production" element={<Production />} />
          <Route path="/simulation" element={<Simulation />} /> {/* <--- Rota Atualizada */}
          
          {/* Vendas */}
          <Route path="/orders" element={<Orders />} />
          <Route path="/orders/new" element={<NewOrder />} />
          <Route path="/orders/edit/:id" element={<NewOrder />} />
          
          {/* Config */}
          <Route path="/settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;