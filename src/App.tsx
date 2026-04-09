import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import EquipmentList from './pages/EquipmentList';
import EquipmentDetail from './pages/EquipmentDetail';
import EquipmentForm from './pages/EquipmentForm';
import PublicEquipment from './pages/PublicEquipment';
import MaintenanceHistory from './pages/MaintenanceHistory';
import UserManagement from './pages/UserManagement';
import CalendarView from './pages/CalendarView';
import PrintSettings from './pages/PrintSettings';
import ClientManagement from './pages/ClientManagement';
import ImportWizard from './pages/ImportWizard';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, loading } = useAuth();
  if (loading) return null;
  if (!token) return <Navigate to="/login" />;
  return <>{children}</>;
};

const AppContent: React.FC = () => {
  const { token, user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Simple state machine for the admin panel
  const renderContent = () => {
    if (isImporting) {
      return <ImportWizard onBack={() => setIsImporting(false)} onSuccess={() => { setIsImporting(false); setActiveTab('equipments'); }} />;
    }
    if (isCreating) {
      return <EquipmentForm onBack={() => setIsCreating(false)} onSuccess={() => { setIsCreating(false); setActiveTab('equipments'); }} />;
    }
    if (editingId) {
      return <EquipmentForm id={editingId} onBack={() => setEditingId(null)} onSuccess={() => { setEditingId(null); setActiveTab('equipments'); }} />;
    }
    if (selectedId) {
      return <EquipmentDetail id={selectedId} onBack={() => setSelectedId(null)} onEdit={(id) => { setSelectedId(null); setEditingId(id); }} />;
    }

    switch (activeTab) {
      case 'dashboard': return <Dashboard onNavigate={(tab, filter) => {
        setActiveTab(tab);
        if (filter) setStatusFilter(filter);
      }} />;
      case 'equipments': return <EquipmentList 
        onSelect={setSelectedId} 
        onNew={() => setIsCreating(true)} 
        onImport={() => setIsImporting(true)}
        onEdit={setEditingId} 
        initialStatus={statusFilter}
        onFilterChange={setStatusFilter}
      />;
      case 'maintenances': return <MaintenanceHistory />;
      case 'calendar': return <CalendarView />;
      case 'clients': return user?.role === 'ADMIN' ? <ClientManagement /> : <Dashboard />;
      case 'settings': return user?.role === 'ADMIN' ? <PrintSettings /> : <Dashboard />;
      case 'users': return user?.role === 'ADMIN' ? <UserManagement /> : <Dashboard />;
      default: return <Dashboard />;
    }
  };

  return (
    <Routes>
      <Route path="/login" element={token ? <Navigate to="/" /> : <Login />} />
      <Route path="/e/:publicId" element={<PublicEquipment />} />
      <Route path="/*" element={
        <ProtectedRoute>
          <Layout activeTab={activeTab} setActiveTab={(tab) => {
            setActiveTab(tab);
            setSelectedId(null);
            setEditingId(null);
            setIsCreating(false);
            setIsImporting(false);
          }}>
            {renderContent()}
          </Layout>
        </ProtectedRoute>
      } />
    </Routes>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}
