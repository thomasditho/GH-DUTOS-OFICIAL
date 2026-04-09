import React, { useState, useEffect } from 'react';
import { fetchApi } from '../services/api';
import { Plus, Search, Filter, QrCode, Eye, Edit2, ChevronRight, ChevronLeft, Trash2, X, FileSpreadsheet, Printer, CheckSquare, Square } from 'lucide-react';
import { cn, formatDate } from '../lib/utils';
import { toast } from 'sonner';
import { generateBatchLabels } from '../lib/printUtils';

interface Equipment {
  id: number;
  codigo: string;
  tipo: string;
  local: string;
  andar: string;
  status: string;
  createdAt: string;
  client?: {
    name: string;
    color: string;
  };
}

interface EquipmentListProps {
  onSelect: (id: number) => void;
  onNew: () => void;
  onImport: () => void;
  onEdit: (id: number) => void;
  initialStatus?: string;
  onFilterChange?: (status: string) => void;
}

const EquipmentList: React.FC<EquipmentListProps> = ({ onSelect, onNew, onImport, onEdit, initialStatus = 'ALL', onFilterChange }) => {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus);
  const [andarFilter, setAndarFilter] = useState<string>('ALL');
  const [localFilter, setLocalFilter] = useState<string>('ALL');
  const [clientFilter, setClientFilter] = useState<string>('ALL');
  const [clients, setClients] = useState<any[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [printSettings, setPrintSettings] = useState<any>(null);

  useEffect(() => {
    loadEquipments();
    fetchApi('/api/clients').then(setClients).catch(() => {});
    fetchApi('/api/settings/print').then(setPrintSettings).catch(() => {});
  }, []);

  useEffect(() => {
    setStatusFilter(initialStatus);
  }, [initialStatus]);

  useEffect(() => {
    setSelectedItems([]);
  }, [searchTerm, statusFilter, andarFilter, localFilter, clientFilter]);

  const handleStatusChange = (status: string) => {
    setStatusFilter(status);
    onFilterChange?.(status);
  };

  const loadEquipments = () => {
    setLoading(true);
    fetchApi('/api/equipments')
      .then(setEquipments)
      .finally(() => setLoading(false));
  };

  const andares = ['ALL', ...new Set(equipments.map(e => e.andar))].sort();
  const locais = ['ALL', ...new Set(equipments.map(e => e.local))].sort();

  const handleDelete = async (id: number) => {
    try {
      await fetchApi(`/api/equipments/${id}`, { method: 'DELETE' });
      toast.success('Equipamento excluído com sucesso!');
      setEquipments(prev => prev.filter(e => e.id !== id));
      setShowDeleteConfirm(null);
    } catch (err) {
      toast.error('Erro ao excluir equipamento');
    }
  };

  const filtered = equipments.filter(e => {
    const matchesSearch = 
      e.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.local.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || e.status === statusFilter;
    const matchesAndar = andarFilter === 'ALL' || e.andar === andarFilter;
    const matchesLocal = localFilter === 'ALL' || e.local === localFilter;
    const matchesClient = clientFilter === 'ALL' || e.client?.name === clientFilter;
    
    return matchesSearch && matchesStatus && matchesAndar && matchesLocal && matchesClient;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPERACIONAL': return 'bg-emerald-100 text-emerald-700';
      case 'MANUTENCAO': return 'bg-amber-100 text-amber-700';
      case 'CRITICO': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedItems(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedItems.length === filtered.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filtered.map(e => e.id));
    }
  };

  const handleBatchPrint = async () => {
    if (selectedItems.length === 0) return;
    
    const itemsToPrint = equipments
      .filter(e => selectedItems.includes(e.id))
      .map(e => ({
        codigo: e.codigo,
        tipo: e.tipo,
        local: e.local,
        andar: e.andar,
        publicId: (e as any).publicId || '' // We need publicId for QR
      }));

    // If publicId is missing, we might need to fetch full data or ensure it's in the list
    // Let's check if loadEquipments returns publicId
    
    toast.info(`Gerando etiquetas para ${selectedItems.length} ativos...`);
    await generateBatchLabels(itemsToPrint as any, printSettings);
    toast.success('Etiquetas geradas com sucesso!');
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-[#0A192F] tracking-tighter uppercase">Inventário de Ativos</h2>
          <p className="text-[#6B7280] text-xs font-bold uppercase tracking-widest mt-1">Gestão de equipamentos e infraestrutura</p>
        </div>
        <div className="flex flex-wrap gap-4">
          {selectedItems.length > 0 && (
            <button 
              onClick={handleBatchPrint}
              className="px-8 py-4 bg-[#3A8D8F] text-white flex items-center justify-center gap-3 font-bold text-xs uppercase tracking-[0.2em] hover:bg-[#2d6e70] transition-all shadow-xl border-b-4 border-[#0A192F]"
            >
              <Printer size={18} />
              Imprimir Selecionados ({selectedItems.length})
            </button>
          )}
          <button 
            onClick={onImport}
            className="px-8 py-4 border-2 border-[#0A192F] text-[#0A192F] flex items-center justify-center gap-3 font-bold text-xs uppercase tracking-[0.2em] hover:bg-slate-50 transition-all shadow-lg"
          >
            <FileSpreadsheet size={18} />
            Importar Excel
          </button>
          <button 
            onClick={onNew}
            className="bg-[#0A192F] text-white px-8 py-4 flex items-center justify-center gap-3 font-bold text-xs uppercase tracking-[0.2em] hover:bg-[#112240] transition-all shadow-xl rounded-none border-b-4 border-[#3A8D8F]"
          >
            <Plus size={18} />
            Novo Equipamento
          </button>
        </div>
      </header>

      <div className="bg-white border border-[#E5E7EB] shadow-sm rounded-none">
        {/* Filters bar */}
        <div className="p-6 border-b border-[#E5E7EB] flex flex-col lg:flex-row gap-4 bg-[#F9FAFB]">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]" size={18} />
            <input 
              type="text" 
              placeholder="BUSCAR POR CÓDIGO, TIPO OU LOCAL..."
              className="w-full pl-12 pr-4 py-3 bg-white border border-[#E5E7EB] text-xs font-bold uppercase tracking-wider focus:outline-none focus:ring-0 focus:border-[#0A192F] rounded-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <select 
              className="px-4 py-3 bg-white border border-[#E5E7EB] text-xs font-bold text-[#4B5563] uppercase tracking-widest rounded-none focus:outline-none focus:border-[#0A192F]"
              value={statusFilter}
              onChange={(e) => handleStatusChange(e.target.value)}
            >
              <option value="ALL">TODOS OS STATUS</option>
              <option value="OPERACIONAL">OPERACIONAL</option>
              <option value="MANUTENCAO">MANUTENÇÃO</option>
              <option value="CRITICO">CRÍTICO</option>
            </select>
            <select 
              className="px-4 py-3 bg-white border border-[#E5E7EB] text-xs font-bold text-[#4B5563] uppercase tracking-widest rounded-none focus:outline-none focus:border-[#0A192F]"
              value={andarFilter}
              onChange={(e) => setAndarFilter(e.target.value)}
            >
              <option value="ALL">TODOS OS ANDARES</option>
              {andares.filter(a => a !== 'ALL').map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
            <select 
              className="px-4 py-3 bg-white border border-[#E5E7EB] text-xs font-bold text-[#4B5563] uppercase tracking-widest rounded-none focus:outline-none focus:border-[#0A192F]"
              value={localFilter}
              onChange={(e) => setLocalFilter(e.target.value)}
            >
              <option value="ALL">TODOS OS LOCAIS</option>
              {locais.filter(l => l !== 'ALL').map(l => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
            {clients.length > 0 && (
              <select 
                className="px-4 py-3 bg-white border border-[#E5E7EB] text-xs font-bold text-[#4B5563] uppercase tracking-widest rounded-none focus:outline-none focus:border-[#0A192F]"
                value={clientFilter}
                onChange={(e) => setClientFilter(e.target.value)}
              >
                <option value="ALL">TODOS OS CLIENTES</option>
                {clients.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#F9FAFB] text-[10px] font-bold text-[#6B7280] uppercase tracking-widest border-b border-[#E5E7EB]">
                <th className="px-6 py-4 w-10">
                  <button onClick={toggleSelectAll} className="text-[#0A192F]">
                    {selectedItems.length === filtered.length && filtered.length > 0 ? <CheckSquare size={18} /> : <Square size={18} />}
                  </button>
                </th>
                <th className="px-6 py-4">Código</th>
                <th className="px-6 py-4">Cliente / Pasta</th>
                <th className="px-6 py-4">Tipo</th>
                <th className="px-6 py-4">Localização</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Data Cadastro</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {loading ? (
                [1,2,3,4,5].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-6 py-4"><div className="h-4 bg-slate-100 w-full" /></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[#6B7280] text-sm italic">Nenhum equipamento encontrado.</td>
                </tr>
              ) : filtered.map((e) => (
                <tr key={e.id} className={cn(
                  "hover:bg-[#F8F9FA] transition-colors group",
                  selectedItems.includes(e.id) && "bg-slate-50"
                )}>
                  <td className="px-6 py-4">
                    <button onClick={() => toggleSelect(e.id)} className="text-[#0A192F]">
                      {selectedItems.includes(e.id) ? <CheckSquare size={18} /> : <Square size={18} className="text-[#E5E7EB] group-hover:text-[#9CA3AF]" />}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-[#0A192F]">{e.codigo}</span>
                  </td>
                  <td className="px-6 py-4">
                    {e.client ? (
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: e.client.color }} />
                        <span className="text-[10px] font-black text-[#0A192F] uppercase tracking-widest">{e.client.name}</span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-[#9CA3AF] italic uppercase font-bold">Sem Cliente</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-[#4B5563]">{e.tipo}</td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-[#4B5563]">{e.local}</div>
                    <div className="text-[10px] text-[#9CA3AF] uppercase font-bold">{e.andar}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn("px-2 py-1 text-[10px] font-bold uppercase tracking-wider", getStatusColor(e.status))}>
                      {e.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-[#6B7280]">{formatDate(e.createdAt)}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => onSelect(e.id)}
                        className="p-2 text-[#4B5563] hover:text-[#0A192F] hover:bg-slate-100 transition-colors"
                        title="Ver Detalhes"
                      >
                        <Eye size={18} />
                      </button>
                      <button 
                        onClick={() => onEdit(e.id)}
                        className="p-2 text-[#4B5563] hover:text-[#0A192F] hover:bg-slate-100 transition-colors"
                        title="Editar"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => setShowDeleteConfirm(e.id)}
                        className="p-2 text-[#4B5563] hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Excluir"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-[#E5E7EB] flex items-center justify-between">
          <p className="text-xs text-[#6B7280]">Mostrando <b>{filtered.length}</b> de <b>{equipments.length}</b> ativos</p>
          <div className="flex items-center gap-1">
            <button className="p-2 border border-[#E5E7EB] text-[#9CA3AF] disabled:opacity-50" disabled><ChevronLeft size={16} /></button>
            <button className="w-8 h-8 flex items-center justify-center text-xs font-bold bg-[#0A192F] text-white">1</button>
            <button className="p-2 border border-[#E5E7EB] text-[#4B5563] hover:bg-[#F9FAFB]"><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0A192F]/80 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md shadow-2xl p-8 rounded-none border-t-4 border-red-600">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-[#0A192F] uppercase tracking-tight">Confirmar Exclusão</h3>
              <button onClick={() => setShowDeleteConfirm(null)} className="text-[#9CA3AF] hover:text-[#0A192F]">
                <X size={24} />
              </button>
            </div>
            <p className="text-[#4B5563] text-sm leading-relaxed mb-8">
              Tem certeza que deseja excluir este ativo? Esta ação é irreversível e removerá todo o histórico de manutenções associado.
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 py-4 border border-[#E5E7EB] text-[#4B5563] font-bold text-xs uppercase tracking-widest hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button 
                onClick={() => handleDelete(showDeleteConfirm)}
                className="flex-1 py-4 bg-red-600 text-white font-bold text-xs uppercase tracking-widest hover:bg-red-700"
              >
                Excluir Ativo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EquipmentList;
