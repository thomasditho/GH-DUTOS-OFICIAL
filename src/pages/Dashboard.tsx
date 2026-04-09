import React, { useState, useEffect } from 'react';
import { fetchApi } from '../services/api';
import { Package, CheckCircle, AlertTriangle, Clock, ArrowRight, BarChart3, PieChart as PieChartIcon } from 'lucide-react';
import { formatDate, cn } from '../lib/utils';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie
} from 'recharts';

interface DashboardProps {
  onNavigate?: (tab: string, filter?: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');

  useEffect(() => {
    fetchApi('/api/clients').then(setClients).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const url = selectedClientId ? `/api/dashboard/stats?clientId=${selectedClientId}` : '/api/dashboard/stats';
    fetchApi(url)
      .then(setStats)
      .finally(() => setLoading(false));
  }, [selectedClientId]);

  if (loading || !stats) return <div className="animate-pulse space-y-8">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {[1,2,3,4].map(i => <div key={i} className="h-32 bg-white border border-[#E5E7EB]" />)}
    </div>
    <div className="h-96 bg-white border border-[#E5E7EB]" />
  </div>;

  const statusData = stats.statusCounts.map((s: any) => ({
    name: s.status,
    value: s._count._all
  }));

  const COLORS = {
    'OPERACIONAL': '#10b981',
    'MANUTENCAO': '#f59e0b',
    'CRITICO': '#ef4444'
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold text-[#0A192F] tracking-tight">Visão Geral do Sistema</h2>
          <p className="text-[#6B7280] mt-1">Acompanhe o status dos ativos e as últimas intervenções técnicas.</p>
        </div>
        {clients.length > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black text-[#9CA3AF] uppercase tracking-widest">Filtrar por Pasta:</span>
            <select 
              className="px-4 py-2 bg-white border border-[#E5E7EB] text-xs font-bold text-[#0A192F] uppercase tracking-widest focus:outline-none focus:border-[#3A8D8F] rounded-none"
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
            >
              <option value="">TODOS OS CLIENTES</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-8 border-l-4 border-[#0A192F] shadow-sm rounded-none">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-[0.2em]">Total de Ativos</p>
              <p className="text-4xl font-black text-[#0A192F] mt-2">{stats.totalEquipments}</p>
            </div>
            <div className="p-4 bg-slate-50 text-[#0A192F]">
              <Package size={28} />
            </div>
          </div>
        </div>

        <div className="bg-white p-8 border-l-4 border-red-500 shadow-sm rounded-none">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-[0.2em]">Manutenções Vencidas</p>
              <p className="text-4xl font-black text-red-600 mt-2">{stats.maintenanceAlerts?.overdue || 0}</p>
            </div>
            <div className="p-4 bg-red-50 text-red-600">
              <AlertTriangle size={28} />
            </div>
          </div>
        </div>

        <div className="bg-white p-8 border-l-4 border-amber-500 shadow-sm rounded-none">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-[0.2em]">Próximos 15 dias</p>
              <p className="text-4xl font-black text-amber-600 mt-2">{stats.maintenanceAlerts?.upcoming || 0}</p>
            </div>
            <div className="p-4 bg-amber-50 text-amber-600">
              <Clock size={28} />
            </div>
          </div>
        </div>

        <div className="bg-white p-8 border-l-4 border-emerald-500 shadow-sm rounded-none">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-[0.2em]">Operacionais</p>
              <p className="text-4xl font-black text-emerald-600 mt-2">
                {stats.statusCounts.find((s: any) => s.status === 'OPERACIONAL')?._count?._all || 0}
              </p>
            </div>
            <div className="p-4 bg-emerald-50 text-emerald-600">
              <CheckCircle size={28} />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white border border-[#E5E7EB] p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 size={18} className="text-[#0A192F]" />
            <h3 className="font-black text-[#0A192F] uppercase tracking-[0.2em] text-xs">Desempenho de Manutenções (6 Meses)</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.performanceChart}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} 
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ border: '1px solid #e2e8f0', borderRadius: '0px', fontSize: '12px', fontWeight: 'bold' }}
                />
                <Bar dataKey="value" fill="#0A192F" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-[#E5E7EB] p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <PieChartIcon size={18} className="text-[#0A192F]" />
            <h3 className="font-black text-[#0A192F] uppercase tracking-[0.2em] text-xs">Distribuição de Status</h3>
          </div>
          <div className="h-64 flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ border: '1px solid #e2e8f0', borderRadius: '0px', fontSize: '12px', fontWeight: 'bold' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="w-48 space-y-2">
              {statusData.map((s: any) => (
                <div key={s.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3" style={{ backgroundColor: COLORS[s.name as keyof typeof COLORS] || '#94a3b8' }} />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">{s.name}</span>
                  </div>
                  <span className="text-xs font-black text-[#0A192F]">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Maintenances */}
        <div className="lg:col-span-2 bg-white border border-[#E5E7EB] shadow-sm rounded-none">
          <div className="p-6 border-b border-[#E5E7EB] flex items-center justify-between bg-[#F9FAFB]">
            <h3 className="font-black text-[#0A192F] uppercase tracking-[0.2em] text-xs">Últimas Intervenções</h3>
            <button 
              onClick={() => onNavigate?.('maintenances')}
              className="text-[10px] font-bold text-[#0A192F] flex items-center gap-1 hover:underline tracking-widest"
            >
              HISTÓRICO COMPLETO <ArrowRight size={14} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#F9FAFB] text-[10px] font-bold text-[#6B7280] uppercase tracking-widest border-b border-[#E5E7EB]">
                  <th className="px-6 py-4">Data</th>
                  <th className="px-6 py-4">Equipamento</th>
                  <th className="px-6 py-4">Descrição</th>
                  <th className="px-6 py-4">Responsável</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {Array.isArray(stats?.recentMaintenances) && stats.recentMaintenances.map((m: any) => (
                  <tr key={m.id} className="hover:bg-[#F8F9FA] transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-[#0A192F]">{formatDate(m.data)}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-[#0A192F]">{m.equipment.codigo}</div>
                      <div className="text-[10px] text-[#6B7280] uppercase">{m.equipment.tipo}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#4B5563] max-w-xs truncate">{m.descricao}</td>
                    <td className="px-6 py-4 text-sm text-[#4B5563]">{m.responsavel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Critical Alerts */}
        <div className="bg-white border border-[#E5E7EB] shadow-sm rounded-none flex flex-col">
          <div className="p-6 border-b border-[#E5E7EB] bg-red-50">
            <h3 className="font-black text-red-700 uppercase tracking-[0.2em] text-xs flex items-center gap-2">
              <AlertTriangle size={16} /> Alertas Críticos
            </h3>
          </div>
          <div className="flex-1 p-6 space-y-4">
            {(stats.statusCounts.find((s: any) => s.status === 'CRITICO')?._count?._all || 0) > 0 ? (
              <p className="text-xs text-[#4B5563] leading-relaxed">
                Existem ativos que requerem atenção imediata. Verifique o inventário para mais detalhes.
              </p>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-2 opacity-50">
                <CheckCircle size={32} className="text-emerald-500" />
                <p className="text-[10px] font-bold uppercase tracking-widest">Tudo sob controle</p>
              </div>
            )}
            
            <button 
              onClick={() => onNavigate?.('equipments', 'CRITICO')}
              className="w-full py-4 bg-[#0A192F] text-white font-bold text-[10px] uppercase tracking-[0.2em] hover:bg-[#112240] transition-all"
            >
              Ver Ativos Críticos
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
