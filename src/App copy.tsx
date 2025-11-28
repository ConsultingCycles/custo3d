import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { NewPrint } from './pages/NewPrint';
import { History } from './pages/History';
import { Filaments } from './pages/Filaments';
import { Stock } from './pages/Stock';
import { Marketplaces } from './pages/Marketplaces';
import { Simulation } from './pages/Simulation';
import { Settings } from './pages/Settings';
import { ProtectedRoute } from './components/Layout';
import { useAuthStore } from './store/authStore';

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
          <Route path="/new-print" element={<NewPrint />} />
          <Route path="/history" element={<History />} />
          <Route path="/filaments" element={<Filaments />} />
          <Route path="/stock" element={<Stock />} />
          <Route path="/marketplaces" element={<Marketplaces />} />
          <Route path="/simulation" element={<Simulation />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
