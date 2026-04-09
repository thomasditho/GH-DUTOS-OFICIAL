import React, { useState, useEffect } from 'react';
import { User as UserIcon, Plus, Search, Shield, Trash2, Edit2, X, Check } from 'lucide-react';
import { fetchApi } from '../services/api';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  createdAt: string;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'OPERATOR'
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await fetchApi('/api/users');
      setUsers(data);
    } catch (err) {
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await fetchApi(`/api/users/${editingUser.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
        toast.success('Usuário atualizado com sucesso');
      } else {
        await fetchApi('/api/users', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
        toast.success('Usuário criado com sucesso');
      }
      setShowModal(false);
      setEditingUser(null);
      setFormData({ name: '', email: '', password: '', role: 'OPERATOR' });
      loadUsers();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar usuário');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return;
    try {
      await fetchApi(`/api/users/${id}`, { method: 'DELETE' });
      toast.success('Usuário excluído');
      loadUsers();
    } catch (err) {
      toast.error('Erro ao excluir usuário');
    }
  };

  const openEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role
    });
    setShowModal(true);
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-[#0A192F] tracking-tighter uppercase">Gestão de Acessos</h2>
          <p className="text-[#6B7280] text-xs font-bold uppercase tracking-widest mt-1">Controle de usuários e permissões do sistema</p>
        </div>
        <button 
          onClick={() => {
            setEditingUser(null);
            setFormData({ name: '', email: '', password: '', role: 'OPERATOR' });
            setShowModal(true);
          }}
          className="bg-[#0A192F] text-white px-8 py-4 flex items-center justify-center gap-3 font-bold text-xs uppercase tracking-[0.2em] hover:bg-[#112240] transition-all shadow-xl rounded-none border-b-4 border-[#3A8D8F]"
        >
          <Plus size={18} />
          Novo Usuário
        </button>
      </header>

      <div className="bg-white border border-[#E5E7EB] shadow-sm rounded-none overflow-hidden">
        <div className="p-6 border-b border-[#E5E7EB] flex flex-col lg:flex-row gap-4 bg-[#F9FAFB]">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]" size={18} />
            <input 
              type="text" 
              placeholder="BUSCAR POR NOME OU EMAIL..."
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
                <th className="px-6 py-4 text-[10px] font-black text-[#6B7280] uppercase tracking-widest">Usuário</th>
                <th className="px-6 py-4 text-[10px] font-black text-[#6B7280] uppercase tracking-widest">Email</th>
                <th className="px-6 py-4 text-[10px] font-black text-[#6B7280] uppercase tracking-widest">Nível de Acesso</th>
                <th className="px-6 py-4 text-[10px] font-black text-[#6B7280] uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-[#9CA3AF] animate-pulse font-bold uppercase text-xs tracking-widest">Carregando usuários...</td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-[#9CA3AF] italic text-sm">Nenhum usuário encontrado.</td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#0A192F] text-white flex items-center justify-center text-xs font-bold">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-bold text-[#0A192F] uppercase tracking-tight">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#4B5563]">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2 py-1 text-[9px] font-black uppercase tracking-widest",
                        user.role === 'ADMIN' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                      )}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => openEdit(user)}
                          className="p-2 text-[#4B5563] hover:bg-[#0A192F] hover:text-white transition-all"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(user.id)}
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

      {/* User Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0A192F]/80 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md shadow-2xl">
            <div className="p-6 border-b border-[#E5E7EB] flex items-center justify-between">
              <h3 className="text-lg font-black text-[#0A192F] uppercase tracking-tighter">
                {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-[#9CA3AF] hover:text-[#0A192F]">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-[#6B7280] uppercase tracking-widest">Nome Completo</label>
                <input 
                  type="text" 
                  required
                  className="w-full px-4 py-3 border border-[#E5E7EB] text-xs font-bold uppercase tracking-wider focus:outline-none focus:border-[#0A192F] rounded-none"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-[#6B7280] uppercase tracking-widest">Email Corporativo</label>
                <input 
                  type="email" 
                  required
                  className="w-full px-4 py-3 border border-[#E5E7EB] text-xs font-bold focus:outline-none focus:border-[#0A192F] rounded-none"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-[#6B7280] uppercase tracking-widest">
                  Senha {editingUser && '(Deixe em branco para manter)'}
                </label>
                <input 
                  type="password" 
                  required={!editingUser}
                  className="w-full px-4 py-3 border border-[#E5E7EB] text-xs font-bold focus:outline-none focus:border-[#0A192F] rounded-none"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-[#6B7280] uppercase tracking-widest">Nível de Acesso</label>
                <select 
                  className="w-full px-4 py-3 border border-[#E5E7EB] text-xs font-bold uppercase tracking-wider focus:outline-none focus:border-[#0A192F] rounded-none"
                  value={formData.role}
                  onChange={e => setFormData({...formData, role: e.target.value})}
                >
                  <option value="OPERATOR">OPERADOR (TÉCNICO)</option>
                  <option value="ADMIN">ADMINISTRADOR (GESTOR)</option>
                </select>
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
                  {editingUser ? 'Salvar Alterações' : 'Criar Conta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
