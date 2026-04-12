import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, Trash2, Edit2, X, Folder, Palette, Package, ArrowLeft, Eye } from 'lucide-react';
import { fetchApi } from '../services/api';
import { toast } from 'sonner';
import { cn, formatDate } from '../lib/utils';
import EquipmentList from './EquipmentList';

interface Client {
  id: number;
  name: string;
  slug: string;
  color: string;
  logoUrl?: string;
  createdAt: string;
}

interface ClientManagementProps {
  onSelectEquipment: (id: number) => void;
  onNewEquipment: (clientId: number) => void;
  onEditEquipment: (id: number) => void;
}

const ClientManagement: React.FC<ClientManagementProps> = ({ onSelectEquipment, onNewEquipment, onEditEquipment }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'inventory'>('details');
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    color: '#3A8D8F',
    logoUrl: ''
  });

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    setLoading(true);
    try {
      const data = await fetchApi('/api/clients');
      setClients(data);
    } catch (err) {
      toast.error('Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingClient) {
        await fetchApi(`/api/clients/${editingClient.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
        toast.success('Cliente atualizado com sucesso');
      } else {
        await fetchApi('/api/clients', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
        toast.success('Cliente criado com sucesso');
      }
      setShowModal(false);
      setEditingClient(null);
      setFormData({ name: '', slug: '', color: '#3A8D8F', logoUrl: '' });
      loadClients();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar cliente');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este cliente? Isso pode afetar os equipamentos vinculados.')) return;
    try {
      await fetchApi(`/api/clients/${id}`, { method: 'DELETE' });
      toast.success('Cliente excluído');
      loadClients();
    } catch (err) {
      toast.error('Erro ao excluir cliente');
    }
  };

  const openEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      slug: client.slug,
      color: client.color,
      logoUrl: client.logoUrl || ''
    });
    setShowModal(true);
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (selectedClient) {
    return (
      <div className="space-y-6">
        <header className="flex items-center gap-4">
          <button 
            onClick={() => setSelectedClient(null)}
            className="p-2 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 flex items-center justify-center text-white" style={{ backgroundColor: selectedClient.color }}>
                <Folder size={16} />
              </div>
              <h2 className="text-2xl font-black text-[#0A192F] tracking-tighter uppercase">{selectedClient.name}</h2>
            </div>
            <p className="text-[#6B7280] text-[10px] font-bold uppercase tracking-widest mt-1">Pasta: {selectedClient.slug}</p>
          </div>
        </header>

        <div className="bg-white border border-[#E5E7EB] shadow-sm">
          <div className="flex border-b border-[#E5E7EB]">
            <button 
              onClick={() => setActiveTab('details')}
              className={cn(
                "px-8 py-4 text-xs font-black uppercase tracking-widest border-b-2 transition-all",
                activeTab === 'details' ? "border-[#0A192F] text-[#0A192F] bg-slate-50" : "border-transparent text-[#9CA3AF] hover:text-[#4B5563]"
              )}
            >
              Dados do Cliente
            </button>
            <button 
              onClick={() => setActiveTab('inventory')}
              className={cn(
                "px-8 py-4 text-xs font-black uppercase tracking-widest border-b-2 transition-all flex items-center gap-2",
                activeTab === 'inventory' ? "border-[#0A192F] text-[#0A192F] bg-slate-50" : "border-transparent text-[#9CA3AF] hover:text-[#4B5563]"
              )}
            >
              <Package size={14} />
              Inventário de Ativos
            </button>
          </div>

          <div className="p-8">
            {activeTab === 'details' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <div>
                    <p className="text-[10px] font-black text-[#9CA3AF] uppercase tracking-widest mb-1">Nome Oficial</p>
                    <p className="text-lg font-bold text-[#0A192F] uppercase">{selectedClient.name}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-[#9CA3AF] uppercase tracking-widest mb-1">Identificador Único</p>
                    <code className="text-sm font-mono font-bold text-[#3A8D8F]">{selectedClient.slug}</code>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-[#9CA3AF] uppercase tracking-widest mb-1">Cor de Identificação</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 border border-[#E5E7EB]" style={{ backgroundColor: selectedClient.color }} />
                      <span className="text-sm font-mono font-bold text-[#4B5563]">{selectedClient.color.toUpperCase()}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-6">
                  <div>
                    <p className="text-[10px] font-black text-[#9CA3AF] uppercase tracking-widest mb-2">Logotipo do Cliente</p>
                    {selectedClient.logoUrl ? (
                      <div className="p-8 border-2 border-dashed border-[#E5E7EB] bg-[#F9FAFB] flex items-center justify-center">
                        <img src={selectedClient.logoUrl} alt="Logo" className="max-h-32 object-contain" />
                      </div>
                    ) : (
                      <div className="p-12 border-2 border-dashed border-[#E5E7EB] bg-[#F9FAFB] text-center">
                        <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest">Nenhuma logo cadastrada</p>
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={() => openEdit(selectedClient)}
                    className="w-full py-4 border-2 border-[#0A192F] text-[#0A192F] font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all"
                  >
                    Editar Informações
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <EquipmentList 
                  clientId={selectedClient.id}
                  onSelect={onSelectEquipment}
                  onNew={() => onNewEquipment(selectedClient.id)}
                  onEdit={onEditEquipment}
                  onImport={() => {}} // Import not needed here or can be added later
                />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-[#0A192F] tracking-tighter uppercase">Gestão de Clientes</h2>
          <p className="text-[#6B7280] text-xs font-bold uppercase tracking-widest mt-1">Organize equipamentos por pastas de clientes</p>
        </div>
        <button 
          onClick={() => {
            setEditingClient(null);
            setFormData({ name: '', slug: '', color: '#3A8D8F', logoUrl: '' });
            setShowModal(true);
          }}
          className="bg-[#0A192F] text-white px-8 py-4 flex items-center justify-center gap-3 font-bold text-xs uppercase tracking-[0.2em] hover:bg-[#112240] transition-all shadow-xl rounded-none border-b-4 border-[#3A8D8F]"
        >
          <Plus size={18} />
          Novo Cliente
        </button>
      </header>

      <div className="bg-white border border-[#E5E7EB] shadow-sm rounded-none overflow-hidden">
        <div className="p-6 border-b border-[#E5E7EB] flex flex-col lg:flex-row gap-4 bg-[#F9FAFB]">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]" size={18} />
            <input 
              type="text" 
              placeholder="BUSCAR POR NOME OU PASTA..."
              className="w-full pl-12 pr-4 py-3 bg-white border border-[#E5E7EB] text-xs font-bold uppercase tracking-wider focus:outline-none focus:ring-0 focus:border-[#0A192F] rounded-none"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                <th className="px-6 py-4 text-[10px] font-black text-[#6B7280] uppercase tracking-widest">Cliente / Pasta</th>
                <th className="px-6 py-4 text-[10px] font-black text-[#6B7280] uppercase tracking-widest">Identificador (Slug)</th>
                <th className="px-6 py-4 text-[10px] font-black text-[#6B7280] uppercase tracking-widest">Cor Visual</th>
                <th className="px-6 py-4 text-[10px] font-black text-[#6B7280] uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-[#9CA3AF] animate-pulse font-bold uppercase text-xs tracking-widest">Carregando clientes...</td>
                </tr>
              ) : filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-[#9CA3AF] italic text-sm">Nenhum cliente encontrado.</td>
                </tr>
              ) : (
                filteredClients.map(client => (
                  <tr key={client.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 flex items-center justify-center text-white" style={{ backgroundColor: client.color }}>
                          <Folder size={16} />
                        </div>
                        <span className="text-sm font-bold text-[#0A192F] uppercase tracking-tight">{client.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-[10px] bg-slate-100 px-2 py-1 text-[#4B5563] font-bold uppercase tracking-widest">
                        {client.slug}
                      </code>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full border border-[#E5E7EB]" style={{ backgroundColor: client.color }} />
                        <span className="text-[10px] font-mono font-bold text-[#6B7280]">{client.color.toUpperCase()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => setSelectedClient(client)}
                          className="p-2 text-[#4B5563] hover:bg-[#3A8D8F] hover:text-white transition-all"
                          title="Ver Inventário"
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          onClick={() => openEdit(client)}
                          className="p-2 text-[#4B5563] hover:bg-[#0A192F] hover:text-white transition-all"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(client.id)}
                          className="p-2 text-[#4B5563] hover:bg-red-500 hover:text-white transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Client Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0A192F]/80 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md shadow-2xl">
            <div className="p-6 border-b border-[#E5E7EB] flex items-center justify-between">
              <h3 className="text-lg font-black text-[#0A192F] uppercase tracking-tighter">
                {editingClient ? 'Editar Cliente' : 'Novo Cliente'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-[#9CA3AF] hover:text-[#0A192F]">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-[#6B7280] uppercase tracking-widest">Nome do Cliente</label>
                <input 
                  type="text" 
                  required
                  className="w-full px-4 py-3 border border-[#E5E7EB] text-xs font-bold uppercase tracking-wider focus:outline-none focus:border-[#0A192F] rounded-none"
                  value={formData.name}
                  onChange={e => {
                    const name = e.target.value;
                    setFormData({...formData, name, slug: editingClient ? formData.slug : generateSlug(name)});
                  }}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-[#6B7280] uppercase tracking-widest">Identificador da Pasta (Slug)</label>
                <input 
                  type="text" 
                  required
                  className="w-full px-4 py-3 border border-[#E5E7EB] text-xs font-bold uppercase tracking-wider focus:outline-none focus:border-[#0A192F] rounded-none bg-slate-50"
                  value={formData.slug}
                  onChange={e => setFormData({...formData, slug: generateSlug(e.target.value)})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-[#6B7280] uppercase tracking-widest flex items-center gap-2">
                  <Palette size={12} /> Cor de Identificação
                </label>
                <div className="flex gap-2">
                  <input 
                    type="color" 
                    className="h-10 w-20 border border-[#E5E7EB] p-1 cursor-pointer"
                    value={formData.color}
                    onChange={e => setFormData({...formData, color: e.target.value})}
                  />
                  <input 
                    type="text" 
                    className="flex-1 px-4 py-3 border border-[#E5E7EB] text-xs font-mono font-bold uppercase focus:outline-none focus:border-[#0A192F] rounded-none"
                    value={formData.color}
                    onChange={e => setFormData({...formData, color: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="pt-6 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-4 border border-[#E5E7EB] text-[#4B5563] font-bold text-xs uppercase tracking-[0.2em] hover:bg-slate-50 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-4 bg-[#0A192F] text-white font-bold text-xs uppercase tracking-[0.2em] hover:bg-[#112240] transition-all border-b-4 border-[#3A8D8F]"
                >
                  {editingClient ? 'Salvar Alterações' : 'Criar Pasta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientManagement;
