import React, { useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import { Settings, FileText, Printer, Save, Upload, Eye, Palette, Layout as LayoutIcon, X } from 'lucide-react';
import { fetchApi } from '../services/api';
import { toast } from 'sonner';
import { QRCodeCanvas } from 'qrcode.react';
import { generateTestReport, generateBatchLabels } from '../lib/printUtils';

const PrintSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'report' | 'label'>('report');
  const [settings, setSettings] = useState<any>({
    logoUrl: '',
    reportHeader: 'GH DUTOS - Sistemas de Manutenção',
    reportFooter: 'www.ghdutos.com.br | (11) 9999-9999',
    reportPrimaryColor: '#0A192F',
    labelWidth: 80,
    labelHeight: 40,
    labelShowCode: true,
    labelShowLocal: true,
    labelShowType: true,
    labelPhone: '(11) 3208-1276',
    labelQrSize: 40,
    labelTemplate: 'modern'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const handleDownloadTestReport = () => {
    generateTestReport(settings);
    toast.success('Relatório de teste gerado!');
  };

  const handleDownloadTestLabel = async () => {
    const testItem = {
      codigo: 'AC-001',
      tipo: 'CHILLER CARRIER',
      local: 'SALA TÉCNICA',
      andar: '2º ANDAR',
      publicId: 'test-id'
    };
    
    try {
      toast.info('Gerando etiqueta de teste...');
      await generateBatchLabels([testItem as any], settings);
      toast.success('Etiqueta de teste gerada com sucesso!');
    } catch (error) {
      console.error('Error generating test label:', error);
      toast.error('Erro ao gerar etiqueta. Verifique as dimensões.');
    }
  };

  useEffect(() => {
    fetchApi('/api/settings/print')
      .then(data => {
        setSettings({
          ...data,
          labelPhone: data.labelPhone || '',
          labelQrSize: data.labelQrSize || 40
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetchApi('/api/settings/print', {
        method: 'POST',
        body: JSON.stringify(settings)
      });
      toast.success('Configurações salvas com sucesso!');
    } catch (err) {
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('A imagem deve ter no máximo 2MB');
        return;
      }

      const toastId = toast.loading('Processando imagem...');
      
      try {
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = reader.result as string;
          
          // Auto-trim white/transparent space
          const trimmedBase64 = await trimImage(base64);
          
          setSettings({ ...settings, logoUrl: trimmedBase64 });
          toast.success('Logo otimizada e carregada!', { id: toastId });
        };
        reader.readAsDataURL(file);
      } catch (err) {
        toast.error('Erro ao processar imagem', { id: toastId });
      }
    }
  };

  const trimImage = (dataUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        let r = { top: canvas.height, left: canvas.width, bottom: 0, right: 0 };

        for (let y = 0; y < canvas.height; y++) {
          for (let x = 0; x < canvas.width; x++) {
            const idx = (y * canvas.width + x) * 4;
            const alpha = data[idx + 3];
            const r_val = data[idx];
            const g_val = data[idx + 1];
            const b_val = data[idx + 2];
            
            // Consider non-transparent and non-white pixels
            const isWhite = r_val > 250 && g_val > 250 && b_val > 250;
            if (alpha > 10 && !isWhite) {
              if (x < r.left) r.left = x;
              if (y < r.top) r.top = y;
              if (x > r.right) r.right = x;
              if (y > r.bottom) r.bottom = y;
            }
          }
        }

        // If no content found or error, return original
        if (r.right <= r.left || r.bottom <= r.top) {
          resolve(dataUrl);
          return;
        }

        // Add a small padding (2px)
        const padding = 2;
        const left = Math.max(0, r.left - padding);
        const top = Math.max(0, r.top - padding);
        const right = Math.min(canvas.width - 1, r.right + padding);
        const bottom = Math.min(canvas.height - 1, r.bottom + padding);
        
        const width = right - left + 1;
        const height = bottom - top + 1;
        
        const trimmedCanvas = document.createElement('canvas');
        trimmedCanvas.width = width;
        trimmedCanvas.height = height;
        const trimmedCtx = trimmedCanvas.getContext('2d');
        trimmedCtx?.drawImage(canvas, left, top, width, height, 0, 0, width, height);
        resolve(trimmedCanvas.toDataURL('image/png'));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  };

  const handleRemoveLogo = () => {
    setSettings({ ...settings, logoUrl: '' });
    toast.success('Logo removida');
  };

  if (loading) return <div className="animate-pulse space-y-8">
    <div className="h-12 bg-white border border-[#E5E7EB]" />
    <div className="h-96 bg-white border border-[#E5E7EB]" />
  </div>;

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-[#0A192F] tracking-tighter uppercase">Configurações de Impressão</h2>
          <p className="text-[#6B7280] text-xs font-bold uppercase tracking-widest mt-1">Personalize o layout dos seus relatórios e etiquetas</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-[#0A192F] text-white font-bold text-xs uppercase tracking-widest hover:bg-[#112240] transition-all disabled:opacity-50"
        >
          <Save size={16} />
          {saving ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </header>

      <div className="bg-white border border-[#E5E7EB] shadow-sm">
        <div className="flex border-b border-[#E5E7EB]">
          <button
            onClick={() => setActiveTab('report')}
            className={`flex items-center gap-2 px-8 py-4 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${
              activeTab === 'report' ? 'border-[#3A8D8F] text-[#0A192F] bg-[#F9FAFB]' : 'border-transparent text-[#9CA3AF] hover:text-[#0A192F]'
            }`}
          >
            <FileText size={16} />
            Relatório PDF
          </button>
          <button
            onClick={() => setActiveTab('label')}
            className={`flex items-center gap-2 px-8 py-4 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${
              activeTab === 'label' ? 'border-[#3A8D8F] text-[#0A192F] bg-[#F9FAFB]' : 'border-transparent text-[#9CA3AF] hover:text-[#0A192F]'
            }`}
          >
            <Printer size={16} />
            Etiquetas QR Code
          </button>
        </div>

        <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Form Section */}
          <div className="space-y-8">
            {activeTab === 'report' ? (
              <>
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#9CA3AF]">Identidade Visual</h3>
                  <div className="flex items-center gap-6">
                    <div className="w-32 h-32 border-2 border-dashed border-[#E5E7EB] flex items-center justify-center bg-[#F9FAFB] relative overflow-hidden group">
                      {settings.logoUrl ? (
                        <>
                          <img src={settings.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain p-2" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button 
                              onClick={handleRemoveLogo}
                              className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                              title="Remover Logo"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <Upload size={24} className="text-[#9CA3AF]" />
                          <span className="text-[8px] font-bold text-[#9CA3AF] uppercase">Upload</span>
                        </div>
                      )}
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleLogoUpload}
                        className={cn("absolute inset-0 opacity-0 cursor-pointer", settings.logoUrl && "hidden")} 
                      />
                    </div>
                    <div className="flex-1 space-y-2">
                      <p className="text-xs font-bold text-[#0A192F]">Logotipo da Empresa</p>
                      <p className="text-[10px] text-[#6B7280] leading-relaxed">Recomendado: PNG transparente, máximo 2MB.</p>
                      {!settings.logoUrl && (
                        <label className="text-[10px] font-black text-[#3A8D8F] uppercase tracking-widest hover:underline cursor-pointer">
                          Selecionar Imagem
                          <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                        </label>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#9CA3AF]">Textos do Relatório</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-[#6B7280] uppercase tracking-widest mb-2">Cabeçalho das Páginas</label>
                      <input
                        type="text"
                        value={settings.reportHeader}
                        onChange={(e) => setSettings({ ...settings, reportHeader: e.target.value })}
                        className="w-full px-4 py-3 bg-[#F9FAFB] border border-[#E5E7EB] text-sm font-medium focus:border-[#0A192F] outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#6B7280] uppercase tracking-widest mb-2">Rodapé das Páginas</label>
                      <input
                        type="text"
                        value={settings.reportFooter}
                        onChange={(e) => setSettings({ ...settings, reportFooter: e.target.value })}
                        className="w-full px-4 py-3 bg-[#F9FAFB] border border-[#E5E7EB] text-sm font-medium focus:border-[#0A192F] outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#9CA3AF]">Cores e Estilo</h3>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={handleDownloadTestReport}
                      className="flex-1 px-6 py-4 bg-white border border-[#0A192F] text-[#0A192F] font-black text-[10px] uppercase tracking-widest hover:bg-[#F9FAFB] transition-all flex items-center justify-center gap-2"
                    >
                      <FileText size={14} />
                      Baixar Relatório de Teste
                    </button>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#6B7280] uppercase tracking-widest mb-2">Cor Principal (Títulos e Tabelas)</label>
                    <div className="flex items-center gap-4">
                      <input
                        type="color"
                        value={settings.reportPrimaryColor}
                        onChange={(e) => setSettings({ ...settings, reportPrimaryColor: e.target.value })}
                        className="w-12 h-12 border-none cursor-pointer"
                      />
                      <input
                        type="text"
                        value={settings.reportPrimaryColor}
                        onChange={(e) => setSettings({ ...settings, reportPrimaryColor: e.target.value })}
                        className="flex-1 px-4 py-3 bg-[#F9FAFB] border border-[#E5E7EB] text-sm font-mono focus:border-[#0A192F] outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#9CA3AF]">Dimensões da Etiqueta</h3>
                  <div className="p-4 bg-emerald-50 border-l-4 border-emerald-500 mb-4">
                    <p className="text-[10px] text-emerald-800 font-bold uppercase tracking-widest">Layout Inteligente:</p>
                    <p className="text-[11px] text-emerald-700 mt-1">O QR Code e a Logo se ajustam proporcionalmente ao tamanho da etiqueta.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-[#6B7280] uppercase tracking-widest mb-2">Largura (mm)</label>
                      <input
                        type="number"
                        value={settings.labelWidth}
                        onChange={(e) => setSettings({ ...settings, labelWidth: parseInt(e.target.value) })}
                        className="w-full px-4 py-3 bg-[#F9FAFB] border border-[#E5E7EB] text-sm font-medium focus:border-[#0A192F] outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#6B7280] uppercase tracking-widest mb-2">Altura (mm)</label>
                      <input
                        type="number"
                        value={settings.labelHeight}
                        onChange={(e) => setSettings({ ...settings, labelHeight: parseInt(e.target.value) })}
                        className="w-full px-4 py-3 bg-[#F9FAFB] border border-[#E5E7EB] text-sm font-medium focus:border-[#0A192F] outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#9CA3AF]">Ajuste do QR Code</h3>
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="block text-[10px] font-bold text-[#6B7280] uppercase tracking-widest">Escala do QR Code (%)</label>
                      <span className="text-[10px] font-black text-[#0A192F]">{settings.labelQrSize}%</span>
                    </div>
                    <input
                      type="range"
                      min="15"
                      max="50"
                      value={settings.labelQrSize || 40}
                      onChange={(e) => setSettings({ ...settings, labelQrSize: parseInt(e.target.value) })}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#0A192F]"
                    />
                    <p className="text-[9px] text-[#9CA3AF] mt-2 uppercase font-bold tracking-widest">Limite de 50% para garantir espaço da logo e textos.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#9CA3AF]">Ações e Contato</h3>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={handleDownloadTestLabel}
                      className="flex-1 px-6 py-4 bg-white border border-[#0A192F] text-[#0A192F] font-black text-[10px] uppercase tracking-widest hover:bg-[#F9FAFB] transition-all flex items-center justify-center gap-2"
                    >
                      <Printer size={14} />
                      Baixar Etiqueta de Teste
                    </button>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#6B7280] uppercase tracking-widest mb-2">Telefone de Contato na Etiqueta</label>
                    <input
                      type="text"
                      value={settings.labelPhone}
                      onChange={(e) => setSettings({ ...settings, labelPhone: e.target.value })}
                      placeholder="(00) 0000-0000"
                      className="w-full px-4 py-3 bg-[#F9FAFB] border border-[#E5E7EB] text-sm font-medium focus:border-[#0A192F] outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#9CA3AF]">Elementos Visíveis</h3>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className={`w-5 h-5 border-2 flex items-center justify-center transition-all ${settings.labelShowCode ? 'bg-[#0A192F] border-[#0A192F]' : 'border-[#E5E7EB]'}`}>
                        {settings.labelShowCode && <div className="w-2 h-2 bg-white" />}
                      </div>
                      <input 
                        type="checkbox" 
                        className="hidden" 
                        checked={settings.labelShowCode}
                        onChange={(e) => setSettings({ ...settings, labelShowCode: e.target.checked })}
                      />
                      <span className="text-xs font-bold text-[#4B5563] uppercase tracking-widest">Mostrar Código do Ativo</span>
                    </label>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Preview Section */}
          <div className="bg-[#F8F9FA] border border-[#E5E7EB] p-4 lg:p-12 flex flex-col items-center justify-center min-h-[500px] relative overflow-hidden">
            <div className="absolute top-4 left-4 flex items-center gap-2 text-[#9CA3AF] z-10">
              <Eye size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest">Pré-visualização em Tempo Real</span>
            </div>

            {activeTab === 'report' ? (
              <div className="w-full max-w-md bg-white shadow-2xl border border-[#E5E7EB] aspect-[1/1.4] p-8 space-y-6 overflow-hidden transform transition-transform hover:scale-[1.02]">
                <div className="flex justify-between items-start border-b-2 pb-4" style={{ borderColor: settings.reportPrimaryColor }}>
                  <div className="w-32 h-16 bg-white flex items-center justify-center overflow-hidden">
                    {settings.logoUrl ? (
                      <img src={settings.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                    ) : (
                      <span className="text-[8px] font-bold text-[#9CA3AF]">LOGO</span>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-tighter" style={{ color: settings.reportPrimaryColor }}>Relatório de Manutenção</p>
                    <p className="text-[8px] text-[#6B7280] mt-1">{settings.reportHeader}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="h-4 w-1/3 bg-slate-100" style={{ backgroundColor: `${settings.reportPrimaryColor}20` }} />
                  <div className="space-y-2">
                    <div className="h-2 w-full bg-slate-50" />
                    <div className="h-2 w-full bg-slate-50" />
                    <div className="h-2 w-2/3 bg-slate-50" />
                  </div>
                </div>

                <div className="mt-auto pt-4 border-t border-slate-100">
                  <p className="text-[7px] text-[#9CA3AF] text-center uppercase font-bold tracking-widest">{settings.reportFooter}</p>
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center p-4">
                <div 
                  className="bg-white shadow-2xl border border-[#E5E7EB] flex flex-col items-center overflow-hidden relative origin-center transition-all duration-300"
                  style={{ 
                    width: `${(Number(settings.labelWidth) || 80) * 4}px`, 
                    height: `${(Number(settings.labelHeight) || 40) * 4}px`,
                    transform: `scale(${Math.min(1, 450 / ((Number(settings.labelWidth) || 80) * 4), 400 / ((Number(settings.labelHeight) || 40) * 4))})`,
                  }}
                >
                  <div className="w-full h-full flex flex-col items-center p-[5%]">
                    {/* 1. QR Code at Top */}
                    <div className="flex items-center justify-center mb-2" style={{ height: `${settings.labelQrSize || 40}%` }}>
                      <QRCodeCanvas 
                        value="https://ghdutos.com.br/asset/AC-001" 
                        size={((Number(settings.labelHeight) || 40) * 4) * ((settings.labelQrSize || 40) / 100)}
                        level="H"
                        includeMargin={false}
                      />
                    </div>

                    {/* 2. Asset Code */}
                    <div className="text-center mb-1">
                      <p className="font-black text-[#0A192F] uppercase tracking-tighter" style={{ fontSize: `${Math.max(10, (Number(settings.labelHeight) || 40) * 0.4)}px` }}>
                        AC-001
                      </p>
                    </div>

                    {/* 3. Horizontal Line */}
                    <div className="w-full h-[2px] bg-[#0A192F] mb-2 opacity-80" />

                    {/* 4. Logo at Bottom */}
                    <div className="flex-1 w-full flex items-center justify-center min-h-0 overflow-hidden">
                      {settings.logoUrl ? (
                        <img src={settings.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 border-2 border-[#0A192F] flex items-center justify-center rotate-45">
                            <span className="text-[8px] font-black -rotate-45">GH</span>
                          </div>
                          <span className="text-[10px] font-black text-[#0A192F] uppercase tracking-widest">GH DUTOS</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintSettings;
