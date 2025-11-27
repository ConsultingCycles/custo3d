import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { LayoutDashboard, PlusCircle, History, Disc, ShoppingCart, Settings, Calculator, LogOut, Package } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import clsx from 'clsx';

export const ProtectedRoute = () => {
  const { user, loading, initialized } = useAuthStore();

  if (loading || !initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-400"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <Outlet />
      </main>
    </div>
  );
};

const Sidebar = () => {
  const location = useLocation();
  const { signOut } = useAuthStore();

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/new-print', icon: PlusCircle, label: 'Nova Impressão' },
    { path: '/history', icon: History, label: 'Histórico' },
    { path: '/filaments', icon: Disc, label: 'Filamentos' },
    { path: '/stock', icon: Package, label: 'Estoque' },
    { path: '/marketplaces', icon: ShoppingCart, label: 'Marketplaces' },
    { path: '/simulation', icon: Calculator, label: 'Simulação' },
    { path: '/settings', icon: Settings, label: 'Configurações' },
  ];

  return (
    <aside className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
      <div className="p-6 flex items-center justify-center border-b border-gray-700">
        <img src="/assets/logo.png" alt="Custo3D Logo" className="h-12 object-contain" />
      </div>
      
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={clsx(
              'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
              location.pathname === item.path
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:bg-gray-700 hover:text-white'
            )}
          >
            <item.icon size={20} />
            <span className="font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-700">
        <button
          onClick={() => signOut()}
          className="flex items-center gap-3 px-4 py-3 w-full text-left text-gray-400 hover:bg-gray-700 hover:text-white rounded-lg transition-colors"
        >
          <LogOut size={20} />
          <span className="font-medium">Sair</span>
        </button>
      </div>
    </aside>
  );
};
