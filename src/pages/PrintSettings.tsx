import React, { useState, useEffect } from 'react';
import { Settings, FileText, Printer, Save, Upload, Eye, Palette, Layout as LayoutIcon } from 'lucide-react';
import { fetchApi } from '../services/api';
import { toast } from 'sonner';

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
    labelShowType: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchApi('/api/settings/print')
      .then(setSettings)
      .finally(() => setLoading(false));
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

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings({ ...settings, logoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
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
                        <img src={settings.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                      ) : (
                        <Upload size={24} className="text-[#9CA3AF]" />
                      )}
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleLogoUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer" 
                      />
                    </div>
                    <div className="flex-1 space-y-2">
                      <p className="text-xs font-bold text-[#0A192F]">Logotipo da Empresa</p>
                      <p className="text-[10px] text-[#6B7280] leading-relaxed">Recomendado: PNG transparente, mínimo 400px de largura.</p>
                      <button className="text-[10px] font-black text-[#3A8D8F] uppercase tracking-widest hover:underline">Alterar Imagem</button>
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
                  <div className="p-4 bg-amber-50 border-l-4 border-amber-500 mb-4">
                    <p className="text-[10px] text-amber-800 font-bold uppercase tracking-widest">Padrão GH DUTOS:</p>
                    <p className="text-[11px] text-amber-700 mt-1">O sistema está otimizado para etiquetas de 80x40mm em um grid de 3x5 por página A4 na impressão em lote.</p>
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
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className={`w-5 h-5 border-2 flex items-center justify-center transition-all ${settings.labelShowLocal ? 'bg-[#0A192F] border-[#0A192F]' : 'border-[#E5E7EB]'}`}>
                        {settings.labelShowLocal && <div className="w-2 h-2 bg-white" />}
                      </div>
                      <input 
                        type="checkbox" 
                        className="hidden" 
                        checked={settings.labelShowLocal}
                        onChange={(e) => setSettings({ ...settings, labelShowLocal: e.target.checked })}
                      />
                      <span className="text-xs font-bold text-[#4B5563] uppercase tracking-widest">Mostrar Localização</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className={`w-5 h-5 border-2 flex items-center justify-center transition-all ${settings.labelShowType ? 'bg-[#0A192F] border-[#0A192F]' : 'border-[#E5E7EB]'}`}>
                        {settings.labelShowType && <div className="w-2 h-2 bg-white" />}
                      </div>
                      <input 
                        type="checkbox" 
                        className="hidden" 
                        checked={settings.labelShowType}
                        onChange={(e) => setSettings({ ...settings, labelShowType: e.target.checked })}
                      />
                      <span className="text-xs font-bold text-[#4B5563] uppercase tracking-widest">Mostrar Tipo de Equipamento</span>
                    </label>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Preview Section */}
          <div className="bg-[#F8F9FA] border border-[#E5E7EB] p-8 flex flex-col items-center justify-center min-h-[500px] relative">
            <div className="absolute top-4 left-4 flex items-center gap-2 text-[#9CA3AF]">
              <Eye size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest">Pré-visualização em Tempo Real</span>
            </div>

            {activeTab === 'report' ? (
              <div className="w-full max-w-md bg-white shadow-2xl border border-[#E5E7EB] aspect-[1/1.4] p-8 space-y-6 overflow-hidden">
                <div className="flex justify-between items-start border-b-2 pb-4" style={{ borderColor: settings.reportPrimaryColor }}>
                  <div className="w-24 h-12 bg-[#F9FAFB] flex items-center justify-center overflow-hidden">
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
              <div 
                className="bg-white shadow-2xl border-2 border-[#0A192F] p-6 flex flex-col items-center justify-center space-y-4"
                style={{ 
                  width: `${settings.labelWidth * 3}px`, 
                  height: `${settings.labelHeight * 3}px`,
                  maxWidth: '100%'
                }}
              >
                <div className="w-2/3 aspect-square bg-slate-100 flex items-center justify-center border-2 border-[#0A192F]">
                  <div className="w-3/4 h-3/4 grid grid-cols-4 grid-rows-4 gap-1">
                    {[...Array(16)].map((_, i) => (
                      <div key={i} className={`bg-[#0A192F] ${Math.random() > 0.5 ? 'opacity-100' : 'opacity-0'}`} />
                    ))}
                  </div>
                </div>
                <div className="text-center space-y-1">
                  {settings.labelShowCode && <p className="text-sm font-black text-[#0A192F] uppercase tracking-tighter">AC-001</p>}
                  {settings.labelShowType && <p className="text-[8px] font-bold text-[#6B7280] uppercase tracking-widest">CHILLER CARRIER</p>}
                  {settings.labelShowLocal && <p className="text-[8px] font-bold text-[#9CA3AF] uppercase tracking-widest">SALA TÉCNICA - 2º ANDAR</p>}
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
