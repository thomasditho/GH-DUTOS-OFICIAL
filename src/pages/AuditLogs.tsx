import React, { useState, useEffect } from 'react';
import { Shield, User, Clock, Database, Search } from 'lucide-react';
import { fetchApi } from '../services/api';
import { formatDate } from '../lib/utils';
import { cn } from '../lib/utils';

const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchApi('/api/audit-logs')
      .then(setLogs)
      .finally(() => setLoading(false));
  }, []);

  const filteredLogs = logs.filter(log => 
    log.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.entity.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.entityId?.includes(searchTerm)
  );

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-10 bg-slate-100 w-1/4" /><div className="h-64 bg-white border" /></div>;

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-[#0A192F] tracking-tighter uppercase">Logs de Auditoria</h2>
          <p className="text-[#6B7280] text-xs font-bold uppercase tracking-widest mt-1">Rastreabilidade total de ações no sistema</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" size={16} />
          <input 
            type="text"
            placeholder="BUSCAR LOGS..."
            className="pl-10 pr-4 py-3 bg-white border border-[#E5E7EB] text-[10px] font-black uppercase tracking-widest focus:border-[#3A8D8F] outline-none w-full sm:w-64"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </header>

      <div className="bg-white border border-[#E5E7EB] shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                <th className="px-6 py-4 text-[10px] font-black text-[#9CA3AF] uppercase tracking-widest">Data/Hora</th>
                <th className="px-6 py-4 text-[10px] font-black text-[#9CA3AF] uppercase tracking-widest">Usuário</th>
                <th className="px-6 py-4 text-[10px] font-black text-[#9CA3AF] uppercase tracking-widest">Ação</th>
                <th className="px-6 py-4 text-[10px] font-black text-[#9CA3AF] uppercase tracking-widest">Entidade</th>
                <th className="px-6 py-4 text-[10px] font-black text-[#9CA3AF] uppercase tracking-widest">Detalhes</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id} className="border-b border-[#F3F4F6] hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#0A192F]">
                      <Clock size={12} className="text-[#9CA3AF]" />
                      {new Date(log.createdAt).toLocaleString('pt-BR')}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-[#0A192F] text-white text-[8px] font-black flex items-center justify-center">
                        {log.user.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-xs font-black text-[#0A192F]">{log.user.name}</div>
                        <div className="text-[9px] text-[#9CA3AF] font-bold">{log.user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2 py-0.5 text-[9px] font-black uppercase tracking-widest",
                      log.action === 'CREATE' ? 'bg-emerald-100 text-emerald-700' :
                      log.action === 'UPDATE' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                    )}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#4B5563]">
                      <Database size={12} className="text-[#9CA3AF]" />
                      {log.entity} <span className="text-[10px] text-[#9CA3AF]">#{log.entityId}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-[10px] text-[#6B7280] font-mono bg-slate-50 p-2 border border-[#E5E7EB] max-w-xs truncate" title={log.details}>
                      {log.details || 'Sem detalhes adicionais'}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;
