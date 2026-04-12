import React, { useState, useEffect } from 'react';
import { fetchApi } from '../services/api';
import { ArrowLeft, Save, Plus, Trash2, Info } from 'lucide-react';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

interface EquipmentFormProps {
  id?: number;
  onBack: () => void;
  onSuccess: () => void;
  preSelectedClientId?: number;
}

const EquipmentForm: React.FC<EquipmentFormProps> = ({ id, onBack, onSuccess, preSelectedClientId }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    codigo: '',
    tipo: 'AR CONDICIONADO',
    local: '',
    andar: 'N/A',
    status: 'OPERACIONAL',
    dataInstalacao: '',
    periodicidadeManutencao: '',
    clientId: preSelectedClientId?.toString() || ''
  });
  const [attributes, setAttributes] = useState<{ key: string; value: string }[]>([]);
  const [clients, setClients] = useState<any[]>([]);

  useEffect(() => {
    fetchApi('/api/clients')
      .then(setClients)
      .catch(() => {}); // Silently fail if not admin or error

    if (id) {
      setLoading(true);
      fetchApi(`/api/equipments/${id}`)
        .then(data => {
          setFormData({
            codigo: data.codigo,
            tipo: data.tipo,
            local: data.local,
            andar: data.andar,
            status: data.status,
            dataInstalacao: data.dataInstalacao ? data.dataInstalacao.split('T')[0] : '',
            periodicidadeManutencao: data.periodicidadeManutencao?.toString() || '',
            clientId: data.clientId?.toString() || ''
          });
          setAttributes(data.attributes.map((a: any) => ({ key: a.key, value: a.value })));
        })
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.codigo.trim()) {
      toast.error('O código de identificação é obrigatório');
      return;
    }

    setLoading(true);
    try {
      const payload = { 
        ...formData, 
        clientId: formData.clientId ? parseInt(formData.clientId) : null,
        attributes 
      };
      await fetchApi(id ? `/api/equipments/${id}` : '/api/equipments', {
        method: id ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
      });
      toast.success(id ? 'Equipamento atualizado com sucesso!' : 'Equipamento cadastrado com sucesso!');
      onSuccess();
    } catch (err) {
      toast.error('Erro ao salvar equipamento. Verifique se o código já existe.');
    } finally {
      setLoading(false);
    }
  };

  const addAttribute = () => setAttributes([...attributes, { key: '', value: '' }]);
  const removeAttribute = (index: number) => setAttributes(attributes.filter((_, i) => i !== index));
  const updateAttribute = (index: number, field: 'key' | 'value', val: string) => {
    const newAttrs = [...attributes];
    newAttrs[index][field] = val;
    setAttributes(newAttrs);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <header className="flex items-center gap-6">
        <button onClick={onBack} className="p-3 hover:bg-slate-100 transition-colors border border-[#E5E7EB]">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-3xl font-black text-[#0A192F] tracking-tighter uppercase">
            {id ? 'Editar Ativo' : 'Novo Ativo'}
          </h2>
          <p className="text-[#6B7280] text-xs font-bold uppercase tracking-widest mt-1">Configuração técnica e localização</p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="space-y-10">
        <div className="bg-white border border-[#E5E7EB] shadow-sm rounded-none">
          <div className="p-6 border-b border-[#E5E7EB] bg-[#F9FAFB] flex items-center gap-3">
            <div className="w-8 h-8 bg-[#0A192F] text-white flex items-center justify-center font-black text-xs">01</div>
            <h3 className="text-xs font-black text-[#0A192F] uppercase tracking-[0.2em]">Dados de Identificação</h3>
          </div>
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[#6B7280] uppercase tracking-widest">Código de Identificação *</label>
              <input 
                type="text" required placeholder="EX: AC-001"
                className="w-full px-4 py-3 bg-[#F8F9FA] border border-[#E5E7EB] text-sm font-bold uppercase tracking-wider focus:border-[#0A192F] outline-none transition-all"
                value={formData.codigo}
                onChange={e => setFormData({...formData, codigo: e.target.value.toUpperCase()})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[#6B7280] uppercase tracking-widest">Tipo de Ativo *</label>
              <select 
                required
                className="w-full px-4 py-3 bg-[#F8F9FA] border border-[#E5E7EB] text-sm font-bold uppercase tracking-wider focus:border-[#0A192F] outline-none transition-all appearance-none"
                value={formData.tipo}
                onChange={e => setFormData({...formData, tipo: e.target.value})}
              >
                <option value="AR CONDICIONADO">AR CONDICIONADO</option>
                <option value="VENTILADOR">VENTILADOR</option>
                <option value="EXAUSTOR">EXAUSTOR</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[#6B7280] uppercase tracking-widest">Local / Setor *</label>
              <input 
                type="text" required placeholder="EX: SALA DE MÁQUINAS"
                className="w-full px-4 py-3 bg-[#F8F9FA] border border-[#E5E7EB] text-sm font-bold uppercase tracking-wider focus:border-[#0A192F] outline-none transition-all"
                value={formData.local}
                onChange={e => setFormData({...formData, local: e.target.value.toUpperCase()})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[#6B7280] uppercase tracking-widest">Status Atual</label>
              <select 
                className="w-full px-4 py-3 bg-[#F8F9FA] border border-[#E5E7EB] text-sm font-bold uppercase tracking-wider focus:border-[#0A192F] outline-none transition-all appearance-none"
                value={formData.status}
                onChange={e => setFormData({...formData, status: e.target.value})}
              >
                <option value="OPERACIONAL">OPERACIONAL</option>
                <option value="MANUTENCAO">MANUTENÇÃO</option>
                <option value="CRITICO">CRÍTICO</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[#6B7280] uppercase tracking-widest">Periodicidade de Revisão (Dias)</label>
              <input 
                type="number" placeholder="EX: 90"
                className="w-full px-4 py-3 bg-[#F8F9FA] border border-[#E5E7EB] text-sm font-bold uppercase tracking-wider focus:border-[#0A192F] outline-none transition-all"
                value={formData.periodicidadeManutencao}
                onChange={e => setFormData({...formData, periodicidadeManutencao: e.target.value})}
              />
            </div>
            {clients.length > 0 && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#6B7280] uppercase tracking-widest">Cliente / Pasta *</label>
                <select 
                  required
                  className="w-full px-4 py-3 bg-[#F8F9FA] border border-[#E5E7EB] text-sm font-bold uppercase tracking-wider focus:border-[#0A192F] outline-none transition-all appearance-none"
                  value={formData.clientId}
                  onChange={e => setFormData({...formData, clientId: e.target.value})}
                >
                  <option value="">SELECIONE UM CLIENTE</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white border border-[#E5E7EB] shadow-sm rounded-none">
          <div className="p-6 border-b border-[#E5E7EB] bg-[#F9FAFB] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#0A192F] text-white flex items-center justify-center font-black text-xs">02</div>
              <h3 className="text-xs font-black text-[#0A192F] uppercase tracking-[0.2em]">Atributos Técnicos</h3>
            </div>
            <button 
              type="button"
              onClick={addAttribute}
              className="text-[10px] font-black text-[#0A192F] border-2 border-[#0A192F] px-4 py-2 hover:bg-[#0A192F] hover:text-white transition-all uppercase tracking-widest"
            >
              Adicionar Campo
            </button>
          </div>
          <div className="p-8 space-y-6">
            {attributes.length === 0 && (
              <div className="text-center py-10 border-2 border-dashed border-[#E5E7EB]">
                <p className="text-xs text-[#9CA3AF] font-bold uppercase tracking-widest">Nenhum atributo técnico adicional.</p>
              </div>
            )}
            {attributes.map((attr, index) => (
              <div key={index} className="flex items-end gap-6 group">
                <div className="flex-1 space-y-2">
                  <label className="text-[10px] font-black text-[#6B7280] uppercase tracking-widest">Especificação (Ex: Marca)</label>
                  <input 
                    type="text" required
                    className="w-full px-4 py-3 bg-[#F8F9FA] border border-[#E5E7EB] text-sm font-bold uppercase tracking-wider focus:border-[#0A192F] outline-none transition-all"
                    value={attr.key}
                    onChange={e => updateAttribute(index, 'key', e.target.value.toUpperCase())}
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <label className="text-[10px] font-black text-[#6B7280] uppercase tracking-widest">Valor (Ex: LG)</label>
                  <input 
                    type="text" required
                    className="w-full px-4 py-3 bg-[#F8F9FA] border border-[#E5E7EB] text-sm font-bold uppercase tracking-wider focus:border-[#0A192F] outline-none transition-all"
                    value={attr.value}
                    onChange={e => updateAttribute(index, 'value', e.target.value.toUpperCase())}
                  />
                </div>
                <button 
                  type="button"
                  onClick={() => removeAttribute(index)}
                  className="p-3 text-red-500 hover:bg-red-50 transition-colors border border-transparent hover:border-red-100"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-6 pt-6">
          <button 
            type="button"
            onClick={onBack}
            className="px-10 py-4 border-2 border-[#E5E7EB] text-[#4B5563] font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-50 transition-all"
          >
            Cancelar
          </button>
          <button 
            type="submit"
            disabled={loading}
            className="px-10 py-4 bg-[#0A192F] text-white font-black text-xs uppercase tracking-[0.2em] hover:bg-[#112240] flex items-center gap-3 shadow-2xl disabled:opacity-50 border-b-4 border-[#3A8D8F] transition-all"
          >
            <Save size={18} />
            {id ? 'Atualizar Ativo' : 'Finalizar Cadastro'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EquipmentForm;
