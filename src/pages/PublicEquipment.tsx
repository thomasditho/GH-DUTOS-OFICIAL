import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { fetchApi } from '../services/api';
import { Package, History, Info, FileText, User, Clock, ShieldCheck } from 'lucide-react';
import { cn, formatDate } from '../lib/utils';

const PublicEquipment: React.FC = () => {
  const { publicId } = useParams<{ publicId: string }>();
  const [equipment, setEquipment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/public/equipment/${publicId}`)
      .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(setEquipment)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [publicId]);

  if (loading) return (
    <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-6">
      <div className="animate-pulse text-[#0A192F] font-bold uppercase tracking-widest">Carregando Ativo...</div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <div className="text-red-500 mb-4 flex justify-center"><Info size={48} /></div>
        <h2 className="text-xl font-bold text-[#0A192F]">Equipamento não encontrado</h2>
        <p className="text-[#6B7280] text-sm mt-2">O QR Code escaneado pode estar inválido ou o ativo foi removido do sistema.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F3F4F6] font-sans text-[#1A1A1A] pb-12">
      <header className="bg-[#0A192F] text-white p-6 sticky top-0 z-10 shadow-2xl border-b-4 border-[#3A8D8F]">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white flex items-center justify-center text-[#0A192F] font-black text-xl shadow-inner">GH</div>
            <div>
              <h1 className="text-xl font-black tracking-tighter leading-none uppercase">DUTOS</h1>
              <p className="text-[9px] text-white/60 uppercase tracking-[0.3em] font-bold mt-1">Engenharia & Manutenção</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-widest border border-white/10">
            <ShieldCheck size={14} className="text-emerald-400" />
            Ativo Verificado
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4 sm:p-8 space-y-8">
        {/* Main Card */}
        <section className="bg-white shadow-2xl border-t-8 border-[#0A192F] overflow-hidden">
          <div className="p-8 border-b border-[#E5E7EB] bg-[#F9FAFB] relative">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <Package size={120} />
            </div>
            <div className="relative z-10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <span className="text-[10px] font-black text-[#9CA3AF] uppercase tracking-[0.3em] mb-1 block">Identificação do Ativo</span>
                  <h2 className="text-4xl font-black text-[#0A192F] tracking-tighter uppercase leading-none">{equipment.codigo}</h2>
                </div>
                <div className={cn(
                  "px-4 py-2 text-xs font-black uppercase tracking-[0.2em] shadow-sm border-b-2",
                  equipment.status === 'OPERACIONAL' ? 'bg-emerald-50 text-emerald-700 border-emerald-500' :
                  equipment.status === 'MANUTENCAO' ? 'bg-amber-50 text-amber-700 border-amber-500' : 'bg-red-50 text-red-700 border-red-500'
                )}>
                  {equipment.status}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 text-[#0A192F]"><Info size={18} /></div>
                  <div>
                    <p className="text-[10px] font-black text-[#9CA3AF] uppercase tracking-widest">Tipo</p>
                    <p className="text-sm font-bold text-[#4B5563] uppercase leading-tight">{equipment.tipo}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 text-[#0A192F]"><Clock size={18} /></div>
                  <div>
                    <p className="text-[10px] font-black text-[#9CA3AF] uppercase tracking-widest">Localização</p>
                    <p className="text-sm font-bold text-[#4B5563] uppercase leading-tight">{equipment.local} • {equipment.andar}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 grid grid-cols-2 sm:grid-cols-3 gap-8 bg-white">
            <div>
              <p className="text-[10px] font-black text-[#9CA3AF] uppercase tracking-widest">Data Instalação</p>
              <p className="text-sm font-bold text-[#0A192F] mt-1">{formatDate(equipment.dataInstalacao)}</p>
            </div>
            {equipment.attributes.map((attr: any) => (
              <div key={attr.id}>
                <p className="text-[10px] font-black text-[#9CA3AF] uppercase tracking-widest">{attr.key}</p>
                <p className="text-sm font-bold text-[#0A192F] mt-1">{attr.value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Maintenance History */}
        <section className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xs font-black text-[#0A192F] uppercase tracking-[0.3em] flex items-center gap-3">
              <History size={16} /> Histórico de Intervenções
            </h3>
            <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest">
              {equipment.maintenances.length} Registros
            </span>
          </div>
          
          {equipment.maintenances.length === 0 ? (
            <div className="bg-white p-12 text-center border-2 border-dashed border-[#E5E7EB] text-[#9CA3AF] font-bold uppercase tracking-widest text-xs">
              Nenhum registro de manutenção encontrado.
            </div>
          ) : (
            <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-[#E5E7EB] before:via-[#E5E7EB] before:to-transparent">
              {equipment.maintenances.map((m: any) => (
                <div key={m.id} className="relative flex items-start gap-6 group">
                  <div className="absolute left-0 w-10 h-10 bg-white border-2 border-[#0A192F] flex items-center justify-center z-10 shadow-sm group-hover:bg-[#0A192F] group-hover:text-white transition-all">
                    <FileText size={18} />
                  </div>
                  <div className="ml-12 flex-1 bg-white p-6 shadow-md border border-[#E5E7EB] hover:border-[#0A192F] transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-[#0A192F]">{formatDate(m.data)}</span>
                        <span className="w-1 h-1 bg-[#E5E7EB] rounded-full"></span>
                        <div className="flex items-center gap-1.5 text-[10px] font-black text-[#6B7280] uppercase tracking-widest">
                          <User size={12} className="text-[#9CA3AF]" /> {m.responsavel}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-[#4B5563] leading-relaxed font-medium">{m.descricao}</p>
                    {m.observacao && (
                      <div className="mt-4 pt-4 border-t border-[#F3F4F6] text-xs text-[#6B7280] italic bg-[#F9FAFB] p-3 border-l-4 border-l-[#E5E7EB]">
                        " {m.observacao} "
                      </div>
                    )}
                    {m.arquivoUrl && (
                      <a 
                        href={m.arquivoUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="mt-6 w-full flex items-center justify-center gap-3 py-4 bg-[#0A192F] text-white text-xs font-black uppercase tracking-[0.2em] hover:bg-[#112240] transition-all shadow-lg"
                      >
                        <FileText size={18} /> Acessar Relatório Técnico PDF
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <footer className="py-12 text-center space-y-4">
          <div className="w-12 h-1 bg-[#E5E7EB] mx-auto"></div>
          <p className="text-[10px] text-[#9CA3AF] font-black uppercase tracking-[0.4em]">
            Sistema de Rastreabilidade GH DUTOS
          </p>
          <p className="text-[8px] text-[#9CA3AF] uppercase tracking-widest">
            © 2026 Todos os direitos reservados
          </p>
        </footer>
      </main>
    </div>
  );
};

export default PublicEquipment;
