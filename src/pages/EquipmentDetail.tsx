import React, { useState, useEffect } from 'react';
import { fetchApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, QrCode, History, Info, Plus, Download, FileText, User, Calendar, AlertCircle, Clock } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { cn, formatDate } from '../lib/utils';
import { jsPDF } from 'jspdf';
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
    const width = 80;
    const height = 40;
    const primaryColor = printSettings?.reportPrimaryColor || '#0A192F';

    const doc = new jsPDF({
      orientation: width > height ? 'landscape' : 'portrait',
      unit: 'mm',
      format: [width, height]
    });

    const hexToRgb = (hex: string) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return [r, g, b];
    };
    const rgb = hexToRgb(primaryColor);

    // Border
    doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
    doc.setLineWidth(0.1);
    doc.rect(2, 2, width - 4, height - 4);

    if (printSettings?.labelTemplate === 'classic') {
      // CLASSIC TEMPLATE
      
      // QR Code at Top
      const qrCanvas = document.getElementById('qr-canvas') as HTMLCanvasElement;
      if (qrCanvas) {
        const qrDataUrl = qrCanvas.toDataURL('image/png');
        doc.addImage(qrDataUrl, 'PNG', (width - 20) / 2, 6, 20, 20);
      }

      // Asset Code in Middle
      doc.setTextColor(rgb[0], rgb[1], rgb[2]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text(equipment.codigo, width / 2, height * 0.6, { align: 'center' });
      
      // Horizontal Line
      doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
      doc.setLineWidth(0.5);
      doc.line(width * 0.15, height * 0.6 + 2, width * 0.85, height * 0.6 + 2);

      // Logo at Bottom - Full Width focus
      const bottomY = height - 15;
      
      if (printSettings?.logoUrl) {
        try {
          // Maximize logo size
          const logoW = 45;
          const logoH = 22;
          doc.addImage(printSettings.logoUrl, 'PNG', (width - logoW) / 2, bottomY - 5, logoW, logoH);
        } catch (e) {
          // Fallback to geometric logo if image fails
          doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
          doc.setLineWidth(0.3);
          const diamondX = width / 2 - 12;
          const diamondY = bottomY;
          doc.line(diamondX, diamondY + 4, diamondX + 4, diamondY);
          doc.line(diamondX + 4, diamondY, diamondX + 8, diamondY + 4);
          doc.line(diamondX + 8, diamondY + 4, diamondX + 4, diamondY + 8);
          doc.line(diamondX + 4, diamondY + 8, diamondX, diamondY + 4);
          doc.setFontSize(5);
          doc.text('GH', diamondX + 4, diamondY + 5, { align: 'center' });
          
          doc.setFontSize(6);
          doc.text('GH INSTALAÇÃO', width / 2 + 2, bottomY + 3);
          doc.setFontSize(6);
          doc.setFont('helvetica', 'bold');
          doc.text(printSettings?.labelPhone || '(11) 3208-1276', width / 2 + 2, bottomY + 6);
        }
      } else {
        // GH Geometric Logo
        doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
        doc.setLineWidth(0.3);
        const diamondX = width / 2 - 12;
        const diamondY = bottomY;
        doc.line(diamondX, diamondY + 4, diamondX + 4, diamondY);
        doc.line(diamondX + 4, diamondY, diamondX + 8, diamondY + 4);
        doc.line(diamondX + 8, diamondY + 4, diamondX + 4, diamondY + 8);
        doc.line(diamondX + 4, diamondY + 8, diamondX, diamondY + 4);
        
        doc.setFontSize(5);
        doc.text('GH', diamondX + 4, diamondY + 5, { align: 'center' });

        doc.setFontSize(6);
        doc.text('GH INSTALAÇÃO', width / 2 + 2, bottomY + 3);
        doc.setFontSize(6);
        doc.setFont('helvetica', 'bold');
        doc.text(printSettings?.labelPhone || '(11) 3208-1276', width / 2 + 2, bottomY + 6);
      }

    } else {
      // MODERN TEMPLATE
      
      // Header Bar
      doc.setFillColor(16, 185, 129); // Emerald-500
      doc.rect(2, 2, width - 4, 1, 'F');

      doc.setFillColor(rgb[0], rgb[1], rgb[2]);
      doc.rect(2, 3, width - 4, 7, 'F');
      
      // Logo or Text
      if (printSettings?.logoUrl) {
        try {
          doc.addImage(printSettings.logoUrl, 'PNG', 6, 3.5, 18, 6);
        } catch (e) {
          doc.setTextColor(255, 255, 255);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(12);
          doc.text('GH DUTOS', 6, 8.5);
        }
      } else {
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('GH DUTOS', 6, 8.5);
      }

      // ID in corner
      doc.setTextColor(255, 255, 255, 0.4);
      doc.setFontSize(6);
      doc.text(`ID: ${equipment.codigo}`, width - 6, 8.5, { align: 'right' });

      // QR Code
      const qrCanvas = document.getElementById('qr-canvas') as HTMLCanvasElement;
      if (qrCanvas) {
        const qrDataUrl = qrCanvas.toDataURL('image/png');
        doc.addImage(qrDataUrl, 'PNG', 6, 14, 24, 24);
      }

      // Content Section
      doc.setTextColor(rgb[0], rgb[1], rgb[2]);
      const contentX = 35;
      let textY = 18;

      if (printSettings?.labelShowCode) {
        doc.setFontSize(6);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(150, 150, 150);
        doc.text('CÓDIGO', contentX, textY);
        textY += 4;
        doc.setFontSize(10);
        doc.setTextColor(rgb[0], rgb[1], rgb[2]);
        doc.text(`${equipment.codigo}`, contentX, textY);
        textY += 6;
      }

      if (printSettings?.labelShowType) {
        doc.setFontSize(6);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(150, 150, 150);
        doc.text('EQUIPAMENTO', contentX, textY);
        textY += 3.5;
        doc.setFontSize(8);
        doc.setTextColor(rgb[0], rgb[1], rgb[2]);
        const tipo = equipment.tipo.length > 25 ? equipment.tipo.substring(0, 25) + '...' : equipment.tipo;
        doc.text(tipo, contentX, textY);
        textY += 5.5;
      }

      if (printSettings?.labelShowLocal) {
        doc.setFontSize(6);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(150, 150, 150);
        doc.text('LOCALIZAÇÃO', contentX, textY);
        textY += 3.5;
        doc.setFontSize(8);
        doc.setTextColor(rgb[0], rgb[1], rgb[2]);
        const local = `${equipment.local} - ${equipment.andar}`;
        const localTrunc = local.length > 25 ? local.substring(0, 25) + '...' : local;
        doc.text(localTrunc, contentX, textY);
      }

      // Footer
      doc.setFontSize(5);
      doc.setTextColor(150, 150, 150);
      doc.text('ghdutos.com.br', 6, height - 5);
      if (printSettings?.labelPhone) {
        doc.setTextColor(rgb[0], rgb[1], rgb[2]);
        doc.setFont('helvetica', 'bold');
        doc.text(printSettings.labelPhone, 6, height - 2.5);
      }
      doc.setTextColor(rgb[0], rgb[1], rgb[2]);
      doc.setFont('helvetica', 'bold');
      doc.text('ENGENHARIA E MANUTENÇÃO', width - 6, height - 3, { align: 'right' });
    }

    doc.save(`etiqueta-${equipment.codigo}.pdf`);
  };

  const generateReport = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const primaryColor = printSettings?.reportPrimaryColor || '#0A192F';
    
    const hexToRgb = (hex: string) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return [r, g, b];
    };
    const rgb = hexToRgb(primaryColor);

    // Header
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
    doc.setLineWidth(1);
    doc.line(0, 40, pageWidth, 40);
    
    if (printSettings?.logoUrl) {
      try {
        doc.addImage(printSettings.logoUrl, 'PNG', 20, 5, 45, 30);
      } catch (e) {
        console.error('Error adding logo to PDF', e);
      }
    }

    doc.setTextColor(rgb[0], rgb[1], rgb[2]);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('RELATÓRIO DE MANUTENÇÃO', printSettings?.logoUrl ? 70 : 20, 25);
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(printSettings?.reportHeader || '', pageWidth - 20, 15, { align: 'right' });
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth - 20, 25, { align: 'right' });

    // Equipment Info
    doc.setTextColor(rgb[0], rgb[1], rgb[2]);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('DADOS DO ATIVO', 20, 55);
    
    doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
    doc.setLineWidth(0.5);
    doc.line(20, 58, 65, 58);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Código:', 20, 68);
    doc.setFont('helvetica', 'normal');
    doc.text(equipment.codigo, 45, 68);

    doc.setFont('helvetica', 'bold');
    doc.text('Tipo:', 20, 75);
    doc.setFont('helvetica', 'normal');
    doc.text(equipment.tipo, 45, 75);

    doc.setFont('helvetica', 'bold');
    doc.text('Localização:', 20, 82);
    doc.setFont('helvetica', 'normal');
    doc.text(`${equipment.local} - ${equipment.andar}`, 45, 82);

    // Maintenance List
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('HISTÓRICO DE INTERVENÇÕES', 20, 100);
    doc.line(20, 103, 90, 103);

    let y = 115;
    equipment.maintenances.forEach((m: any, index: number) => {
      if (y > 250) {
        doc.addPage();
        y = 30;
      }

      doc.setFillColor(249, 250, 251);
      doc.rect(20, y, pageWidth - 40, 35, 'F');
      doc.setDrawColor(229, 231, 235);
      doc.rect(20, y, pageWidth - 40, 35, 'S');

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`Data: ${formatDate(m.data)}`, 25, y + 10);
      doc.text(`Responsável: ${m.responsavel}`, pageWidth - 25, y + 10, { align: 'right' });

      doc.setFont('helvetica', 'normal');
      const splitDesc = doc.splitTextToSize(m.descricao, pageWidth - 50);
      doc.text(splitDesc, 25, y + 20);

      y += 45;
    });

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(printSettings?.reportFooter || '', pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
    }

    doc.save(`relatorio-${equipment.codigo}.pdf`);
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
              <span className={cn(
                "px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                equipment.status === 'OPERACIONAL' ? 'bg-emerald-100 text-emerald-700' :
                equipment.status === 'MANUTENCAO' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
              )}>
                {equipment.status}
              </span>
            </div>
            <p className="text-[#6B7280] text-xs font-bold uppercase tracking-widest mt-1">{equipment.tipo} • {equipment.local} ({equipment.andar})</p>
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
