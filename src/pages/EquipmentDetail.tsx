import React, { useState, useEffect } from 'react';
import { fetchApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, QrCode, History, Info, Plus, Download, FileText, User, Calendar, AlertCircle, Clock, Wind, Wrench, AlertTriangle } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { cn, formatDate } from '../lib/utils';
import { generateBatchLabels, generateTestReport } from '../lib/printUtils';
import { toast } from 'sonner';

interface EquipmentDetailProps {
  id: number;
  onBack: () => void;
  onEdit: (id: number) => void;
}

const EquipmentDetail: React.FC<EquipmentDetailProps> = ({ id, onBack, onEdit }) => {
  const { user } = useAuth();
  const [equipment, setEquipment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [printSettings, setPrintSettings] = useState<any>(null);
  const [maintenanceForm, setMaintenanceForm] = useState({
    data: new Date().toISOString().split('T')[0],
    descricao: '',
    responsavel: '',
    observacao: ''
  });
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      fetchApi(`/api/equipments/${id}`),
      fetchApi('/api/settings/print')
    ]).then(([e, s]) => {
      setEquipment(e);
      setPrintSettings(s);
    }).finally(() => setLoading(false));
  };

  const handleAddMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('equipmentId', id.toString());
    formData.append('data', maintenanceForm.data);
    formData.append('descricao', maintenanceForm.descricao);
    formData.append('responsavel', maintenanceForm.responsavel);
    formData.append('observacao', maintenanceForm.observacao);
    if (file) formData.append('arquivo', file);

    try {
      await fetch('/api/maintenances', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('gh_dutos_token')}` },
        body: formData
      });
      setShowMaintenanceModal(false);
      toast.success('Manutenção registrada com sucesso!');
      loadData();
    } catch (err) {
      toast.error('Erro ao registrar manutenção');
    }
  };

  const generateLabel = () => {
    if (!equipment || !printSettings) return;
    
    const labelData = {
      codigo: equipment.codigo,
      tipo: equipment.tipo,
      local: equipment.local,
      andar: equipment.andar,
      publicId: equipment.publicId
    };

    generateBatchLabels([labelData], printSettings);
    toast.success('Etiqueta gerada com sucesso!');
  };

  const generateReport = () => {
    if (!printSettings) return;
    generateTestReport(printSettings);
    toast.success('Relatório gerado com sucesso!');
  };

  if (loading || !equipment) return <div className="animate-pulse space-y-8">
    <div className="h-10 bg-slate-200 w-1/4" />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="col-span-2 h-96 bg-white border" />
      <div className="h-96 bg-white border" />
    </div>
  </div>;

  const publicUrl = `${window.location.origin}/e/${equipment.publicId}`;

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-black text-[#0A192F] tracking-tighter uppercase">{equipment.codigo}</h2>
              {equipment.status === 'OPERACIONAL' ? (
                <div className="flex items-center gap-2 text-emerald-600">
                  <Wind size={18} className="animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Operacional</span>
                </div>
              ) : equipment.status === 'MANUTENCAO' ? (
                <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-2 py-0.5 border border-amber-200">
                  <Wrench size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Em Manutenção</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 px-2 py-0.5 border border-red-200">
                  <AlertTriangle size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">{equipment.status}</span>
                </div>
              )}
            </div>
            <p className="text-[#6B7280] text-xs font-bold uppercase tracking-widest mt-1">{equipment.tipo} • {equipment.local}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {user?.role === 'ADMIN' && (
            <button 
              onClick={() => onEdit(equipment.id)}
              className="px-4 py-2 border-2 border-[#E5E7EB] text-xs font-black text-[#4B5563] hover:bg-slate-50 uppercase tracking-widest transition-all"
            >
              Editar Ativo
            </button>
          )}
          <button 
            onClick={() => setShowMaintenanceModal(true)}
            className="px-4 py-2 bg-[#0A192F] text-white text-xs font-black hover:bg-[#112240] uppercase tracking-widest flex items-center gap-2 shadow-lg border-b-4 border-[#3A8D8F] transition-all"
          >
            <Plus size={16} />
            Registrar Manutenção
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white border border-[#E5E7EB] shadow-sm">
            <div className="p-4 border-b border-[#E5E7EB] bg-[#F9FAFB] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Info size={16} className="text-[#0A192F]" />
                <h3 className="text-xs font-black text-[#0A192F] uppercase tracking-[0.2em]">Informações Técnicas</h3>
              </div>
            </div>
            <div className="p-8 grid grid-cols-1 sm:grid-cols-2 gap-y-8 gap-x-12">
              <div>
                <p className="text-[10px] font-black text-[#9CA3AF] uppercase tracking-[0.2em]">Data de Instalação</p>
                <p className="text-sm font-bold text-[#0A192F] mt-1">{formatDate(equipment.dataInstalacao)}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-[#9CA3AF] uppercase tracking-[0.2em]">Periodicidade de Revisão</p>
                <p className="text-sm font-bold text-[#0A192F] mt-1">{equipment.periodicidadeManutencao ? `${equipment.periodicidadeManutencao} dias` : 'Não definida'}</p>
              </div>
              {equipment.attributes.map((attr: any) => (
                <div key={attr.id}>
                  <p className="text-[10px] font-black text-[#9CA3AF] uppercase tracking-[0.2em]">{attr.key}</p>
                  <p className="text-sm font-bold text-[#0A192F] mt-1">{attr.value}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white border border-[#E5E7EB] shadow-sm">
            <div className="p-4 border-b border-[#E5E7EB] bg-[#F9FAFB] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History size={16} className="text-[#0A192F]" />
                <h3 className="text-xs font-black text-[#0A192F] uppercase tracking-[0.2em]">Linha do Tempo de Intervenções</h3>
              </div>
              <button 
                onClick={generateReport}
                className="text-[10px] font-black text-[#0A192F] flex items-center gap-2 hover:underline tracking-widest border border-[#E5E7EB] px-3 py-1.5 bg-white"
              >
                <Download size={14} /> EXPORTAR HISTÓRICO (PDF)
              </button>
            </div>
            <div className="p-8">
              {equipment.maintenances.length === 0 ? (
                <div className="text-center py-12 text-[#9CA3AF] font-bold uppercase tracking-widest text-xs border-2 border-dashed border-[#F3F4F6]">Nenhuma manutenção registrada.</div>
              ) : (
                <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-[#E5E7EB] before:via-[#E5E7EB] before:to-transparent">
                  {equipment.maintenances.map((m: any) => (
                    <div key={m.id} className="relative flex items-start gap-6 group">
                      <div className="absolute left-0 w-10 h-10 bg-white border-2 border-[#0A192F] flex items-center justify-center z-10 shadow-sm group-hover:bg-[#0A192F] group-hover:text-white transition-all">
                        <Clock size={18} />
                      </div>
                      <div className="ml-12 flex-1 bg-[#F9FAFB] p-6 border border-[#E5E7EB] hover:border-[#0A192F] transition-all">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                          <span className="text-sm font-black text-[#0A192F]">{formatDate(m.data)}</span>
                          <div className="flex items-center gap-2 text-[10px] font-black text-[#6B7280] uppercase tracking-widest">
                            <User size={12} className="text-[#9CA3AF]" /> {m.responsavel}
                          </div>
                        </div>
                        <p className="text-sm text-[#4B5563] leading-relaxed font-medium">{m.descricao}</p>
                        {m.observacao && (
                          <div className="mt-4 pt-4 border-t border-[#E5E7EB] text-xs text-[#6B7280] italic bg-white p-3">
                            " {m.observacao} "
                          </div>
                        )}
                        {m.arquivoUrl && (
                          <a 
                            href={m.arquivoUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="mt-6 inline-flex items-center gap-3 text-xs font-black text-[#0A192F] hover:bg-[#0A192F] hover:text-white px-4 py-3 border-2 border-[#0A192F] transition-all uppercase tracking-widest"
                          >
                            <FileText size={16} /> Acessar Relatório Técnico (PDF)
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* QR & Label */}
        <div className="space-y-8">
          <section className="bg-white border border-[#E5E7EB] shadow-lg p-8 text-center border-t-4 border-t-[#0A192F]">
            <h3 className="text-xs font-black text-[#0A192F] uppercase tracking-[0.3em] mb-8">Identificador QR Code</h3>
            <div className="flex justify-center mb-8 p-6 bg-white border-2 border-[#F3F4F6] shadow-inner">
              <QRCodeCanvas id="qr-canvas" value={publicUrl} size={200} level="H" includeMargin={true} />
            </div>
            <p className="text-[10px] text-[#9CA3AF] break-all mb-8 font-mono bg-[#F9FAFB] p-2 border border-[#E5E7EB]">{publicUrl}</p>
            <button 
              onClick={generateLabel}
              className="w-full py-4 bg-[#0A192F] text-white font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-[#112240] transition-all shadow-xl border-b-4 border-[#3A8D8F]"
            >
              <Download size={20} />
              Gerar Etiqueta PDF
            </button>
          </section>

          <section className="bg-white border-l-4 border-l-amber-500 p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-amber-50 text-amber-600"><AlertCircle size={20} /></div>
              <div>
                <h4 className="text-xs font-black text-[#0A192F] uppercase tracking-widest mb-2">Próxima Manutenção</h4>
                <p className="text-xs text-[#6B7280] leading-relaxed font-medium">
                  Baseado na periodicidade de {equipment.periodicidadeManutencao || 'N/A'} dias, o sistema monitora automaticamente o vencimento deste ativo.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Maintenance Modal */}
      {showMaintenanceModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0A192F]/80 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg shadow-2xl">
            <div className="p-6 border-b border-[#E5E7EB] flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#0A192F] uppercase tracking-tight">Registrar Intervenção</h3>
              <button onClick={() => setShowMaintenanceModal(false)} className="text-[#9CA3AF] hover:text-[#0A192F]">
                <Plus size={24} className="rotate-45" />
              </button>
            </div>
            <form onSubmit={handleAddMaintenance} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#6B7280] uppercase">Data</label>
                  <input 
                    type="date" 
                    required
                    className="w-full px-3 py-2 border border-[#E5E7EB] text-sm focus:outline-none focus:ring-1 focus:ring-[#0A192F]"
                    value={maintenanceForm.data}
                    onChange={e => setMaintenanceForm({...maintenanceForm, data: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#6B7280] uppercase">Responsável</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Nome do técnico"
                    className="w-full px-3 py-2 border border-[#E5E7EB] text-sm focus:outline-none focus:ring-1 focus:ring-[#0A192F]"
                    value={maintenanceForm.responsavel}
                    onChange={e => setMaintenanceForm({...maintenanceForm, responsavel: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#6B7280] uppercase">Descrição do Serviço</label>
                <textarea 
                  required
                  rows={3}
                  placeholder="O que foi realizado?"
                  className="w-full px-3 py-2 border border-[#E5E7EB] text-sm focus:outline-none focus:ring-1 focus:ring-[#0A192F]"
                  value={maintenanceForm.descricao}
                  onChange={e => setMaintenanceForm({...maintenanceForm, descricao: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#6B7280] uppercase">Observações Extras</label>
                <textarea 
                  rows={2}
                  className="w-full px-3 py-2 border border-[#E5E7EB] text-sm focus:outline-none focus:ring-1 focus:ring-[#0A192F]"
                  value={maintenanceForm.observacao}
                  onChange={e => setMaintenanceForm({...maintenanceForm, observacao: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#6B7280] uppercase">Relatório Técnico (PDF)</label>
                <input 
                  type="file" 
                  accept=".pdf,image/*"
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:border-0 file:text-xs file:font-bold file:bg-[#0A192F] file:text-white hover:file:bg-[#112240]"
                  onChange={e => setFile(e.target.files?.[0] || null)}
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setShowMaintenanceModal(false)}
                  className="flex-1 py-3 border border-[#E5E7EB] text-[#4B5563] font-bold text-xs uppercase tracking-wider hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-[#0A192F] text-white font-bold text-xs uppercase tracking-wider hover:bg-[#112240]"
                >
                  Salvar Registro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EquipmentDetail;
