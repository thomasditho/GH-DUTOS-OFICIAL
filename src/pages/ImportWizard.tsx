import React, { useState, useEffect } from 'react';
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, ArrowRight, ArrowLeft, Loader2, Download, Table } from 'lucide-react';
import { fetchApi } from '../services/api';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { cn } from '../lib/utils';

interface ImportWizardProps {
  onBack: () => void;
  onSuccess: () => void;
}

const ImportWizard: React.FC<ImportWizardProps> = ({ onBack, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState({
    codigo: '',
    tipo: '',
    local: '',
    andar: '',
    periodicidade: ''
  });
  const [results, setResults] = useState<{ success: number; errors: string[] } | null>(null);

  useEffect(() => {
    fetchApi('/api/clients').then(setClients).catch(() => {});
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
      
      if (rows.length > 0) {
        // Intelligent Header Discovery
        let headerRowIndex = 0;
        const keywords = ['tag', 'cod', 'identif', 'tipo', 'equip', 'local', 'setor', 'andar', 'pav', 'period'];
        
        for (let i = 0; i < Math.min(rows.length, 10); i++) {
          const row = rows[i];
          if (!row || !Array.isArray(row)) continue;
          
          const matches = row.filter(cell => 
            cell && typeof cell === 'string' && 
            keywords.some(kw => cell.toLowerCase().includes(kw))
          ).length;

          if (matches >= 2) {
            headerRowIndex = i;
            break;
          }
        }

        const detectedHeaders = rows[headerRowIndex].map(h => String(h || '').trim()).filter(Boolean);
        setHeaders(detectedHeaders);

        // Auto-mapping attempt
        const h = detectedHeaders.map(s => s.toLowerCase());
        setMapping({
          codigo: detectedHeaders.find((_, i) => h[i].includes('tag') || h[i].includes('cod') || h[i].includes('identif')) || '',
          tipo: detectedHeaders.find((_, i) => h[i].includes('tipo') || h[i].includes('equip')) || '',
          local: detectedHeaders.find((_, i) => h[i].includes('local') || h[i].includes('setor')) || '',
          andar: detectedHeaders.find((_, i) => h[i].includes('andar') || h[i].includes('pav')) || '',
          periodicidade: detectedHeaders.find((_, i) => h[i].includes('period') || h[i].includes('dias') || h[i].includes('frequ')) || ''
        });
      }
    };
    reader.readAsBinaryString(uploadedFile);
  };

  const startImport = async () => {
    if (!file || !selectedClientId) return;
    
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('clientId', selectedClientId);
    formData.append('mapping', JSON.stringify(mapping));

    try {
      const response = await fetch('/api/equipments/import', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('gh_token')}`
        },
        body: formData
      });
      
      if (!response.ok) throw new Error('Erro na importação');
      
      const data = await response.json();
      setResults(data);
      setStep(4);
    } catch (err) {
      toast.error('Erro ao processar importação');
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      { 'TAG/CÓDIGO': 'AC-001', 'TIPO': 'CHILLER', 'LOCAL': 'SALA DE MÁQUINAS', 'ANDAR': 'TÉRREO', 'PERIODICIDADE (DIAS)': '90', 'MARCA': 'LG', 'MODELO': 'MULTI V' },
      { 'TAG/CÓDIGO': 'AC-002', 'TIPO': 'SPLIT', 'LOCAL': 'RECEPÇÃO', 'ANDAR': '1º ANDAR', 'PERIODICIDADE (DIAS)': '30', 'MARCA': 'SAMSUNG', 'MODELO': 'WIND-FREE' }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Equipamentos');
    XLSX.writeFile(wb, 'modelo_importacao_gh_dutos.xlsx');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <header className="flex items-center gap-6">
        <button onClick={onBack} className="p-3 hover:bg-slate-100 transition-colors border border-[#E5E7EB]">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-3xl font-black text-[#0A192F] tracking-tighter uppercase">Importação em Massa</h2>
          <p className="text-[#6B7280] text-xs font-bold uppercase tracking-widest mt-1">Cadastre centenas de ativos via planilha Excel</p>
        </div>
      </header>

      {/* Steps Indicator */}
      <div className="flex items-center justify-between bg-white p-6 border border-[#E5E7EB] shadow-sm">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center gap-3">
            <div className={cn(
              "w-8 h-8 flex items-center justify-center font-black text-xs transition-all",
              step === s ? "bg-[#3A8D8F] text-white scale-110" : 
              step > s ? "bg-[#0A192F] text-white" : "bg-slate-100 text-slate-400"
            )}>
              {step > s ? <CheckCircle2 size={16} /> : `0${s}`}
            </div>
            <span className={cn(
              "text-[10px] font-black uppercase tracking-widest hidden sm:block",
              step === s ? "text-[#0A192F]" : "text-[#9CA3AF]"
            )}>
              {s === 1 ? 'Upload' : s === 2 ? 'Mapeamento' : s === 3 ? 'Revisão' : 'Resultado'}
            </span>
            {s < 4 && <div className="w-8 h-px bg-slate-200 mx-2 hidden sm:block" />}
          </div>
        ))}
      </div>

      <div className="bg-white border border-[#E5E7EB] shadow-2xl min-h-[400px] flex flex-col">
        {step === 1 && (
          <div className="p-12 flex-1 flex flex-col items-center justify-center text-center space-y-8">
            <div className="w-20 h-20 bg-slate-50 flex items-center justify-center text-[#3A8D8F] rounded-full">
              <Upload size={40} />
            </div>
            <div className="max-w-md space-y-2">
              <h3 className="text-xl font-black text-[#0A192F] uppercase tracking-tight">Selecione o Arquivo</h3>
              <p className="text-sm text-[#6B7280]">Escolha o cliente e faça o upload da planilha (.xlsx ou .csv) para iniciar o mapeamento.</p>
            </div>

            <div className="w-full max-w-sm space-y-6">
              <div className="space-y-2 text-left">
                <label className="text-[10px] font-black text-[#6B7280] uppercase tracking-widest">Cliente / Pasta Destino</label>
                <select 
                  className="w-full px-4 py-4 bg-slate-50 border border-[#E5E7EB] text-xs font-bold uppercase tracking-widest focus:border-[#3A8D8F] outline-none"
                  value={selectedClientId}
                  onChange={e => setSelectedClientId(e.target.value)}
                >
                  <option value="">SELECIONE O CLIENTE</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <label className="block w-full cursor-pointer group">
                <input type="file" className="hidden" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} />
                <div className="w-full py-8 border-2 border-dashed border-[#E5E7EB] group-hover:border-[#3A8D8F] group-hover:bg-slate-50 transition-all flex flex-col items-center gap-2">
                  <FileSpreadsheet className="text-[#9CA3AF] group-hover:text-[#3A8D8F]" size={32} />
                  <span className="text-[10px] font-black text-[#9CA3AF] group-hover:text-[#0A192F] uppercase tracking-widest">
                    {file ? file.name : 'Clique para selecionar arquivo'}
                  </span>
                </div>
              </label>

              <button 
                onClick={downloadTemplate}
                className="text-[10px] font-black text-[#3A8D8F] uppercase tracking-widest flex items-center gap-2 mx-auto hover:underline"
              >
                <Download size={14} /> Baixar Planilha Modelo
              </button>
            </div>

            <button 
              disabled={!file || !selectedClientId}
              onClick={() => setStep(2)}
              className="px-12 py-4 bg-[#0A192F] text-white font-black text-xs uppercase tracking-[0.2em] hover:bg-[#112240] disabled:opacity-50 transition-all flex items-center gap-3"
            >
              Próximo Passo <ArrowRight size={18} />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="p-8 flex-1 flex flex-col">
            <div className="mb-8 p-4 bg-blue-50 border-l-4 border-blue-500 flex items-start gap-4">
              <Table className="text-blue-600 mt-1" size={20} />
              <div>
                <h4 className="text-xs font-black text-blue-900 uppercase tracking-widest">Mapeamento de Colunas</h4>
                <p className="text-[11px] text-blue-700 mt-1">Relacione os campos do sistema com as colunas da sua planilha. Colunas não mapeadas serão importadas como atributos técnicos.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#6B7280] uppercase tracking-widest">Código / TAG (Obrigatório)</label>
                  <select 
                    className="w-full px-4 py-3 border border-[#E5E7EB] text-xs font-bold uppercase focus:border-[#3A8D8F] outline-none"
                    value={mapping.codigo}
                    onChange={e => setMapping({...mapping, codigo: e.target.value})}
                  >
                    <option value="">Selecione a coluna...</option>
                    {headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#6B7280] uppercase tracking-widest">Tipo de Ativo (Obrigatório)</label>
                  <select 
                    className="w-full px-4 py-3 border border-[#E5E7EB] text-xs font-bold uppercase focus:border-[#3A8D8F] outline-none"
                    value={mapping.tipo}
                    onChange={e => setMapping({...mapping, tipo: e.target.value})}
                  >
                    <option value="">Selecione a coluna...</option>
                    {headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#6B7280] uppercase tracking-widest">Local / Setor (Obrigatório)</label>
                  <select 
                    className="w-full px-4 py-3 border border-[#E5E7EB] text-xs font-bold uppercase focus:border-[#3A8D8F] outline-none"
                    value={mapping.local}
                    onChange={e => setMapping({...mapping, local: e.target.value})}
                  >
                    <option value="">Selecione a coluna...</option>
                    {headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#6B7280] uppercase tracking-widest">Andar / Pavimento</label>
                  <select 
                    className="w-full px-4 py-3 border border-[#E5E7EB] text-xs font-bold uppercase focus:border-[#3A8D8F] outline-none"
                    value={mapping.andar}
                    onChange={e => setMapping({...mapping, andar: e.target.value})}
                  >
                    <option value="">Nenhum (Usar padrão)</option>
                    {headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#6B7280] uppercase tracking-widest">Periodicidade (Dias)</label>
                  <select 
                    className="w-full px-4 py-3 border border-[#E5E7EB] text-xs font-bold uppercase focus:border-[#3A8D8F] outline-none"
                    value={mapping.periodicidade}
                    onChange={e => setMapping({...mapping, periodicidade: e.target.value})}
                  >
                    <option value="">Nenhum</option>
                    {headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-12 flex justify-between">
              <button onClick={() => setStep(1)} className="px-8 py-4 border border-[#E5E7EB] text-[#4B5563] font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all">
                Voltar
              </button>
              <button 
                disabled={!mapping.codigo || !mapping.tipo || !mapping.local}
                onClick={() => setStep(3)} 
                className="px-12 py-4 bg-[#0A192F] text-white font-black text-xs uppercase tracking-[0.2em] hover:bg-[#112240] disabled:opacity-50 transition-all flex items-center gap-3"
              >
                Revisar Dados <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="p-12 flex-1 flex flex-col items-center justify-center text-center space-y-8">
            <div className="w-20 h-20 bg-amber-50 flex items-center justify-center text-amber-500 rounded-full">
              <AlertCircle size={40} />
            </div>
            <div className="max-w-md space-y-2">
              <h3 className="text-xl font-black text-[#0A192F] uppercase tracking-tight">Tudo Pronto?</h3>
              <p className="text-sm text-[#6B7280]">
                O sistema irá processar o arquivo e criar os ativos para o cliente <b>{clients.find(c => c.id.toString() === selectedClientId)?.name}</b>.
                Códigos duplicados serão ignorados.
              </p>
            </div>

            <div className="bg-slate-50 p-6 border border-[#E5E7EB] w-full max-w-sm text-left space-y-3">
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                <span className="text-[#9CA3AF]">Arquivo:</span>
                <span className="text-[#0A192F]">{file?.name}</span>
              </div>
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                <span className="text-[#9CA3AF]">Colunas Mapeadas:</span>
                <span className="text-[#0A192F]">{Object.values(mapping).filter(Boolean).length}</span>
              </div>
            </div>

            <div className="flex gap-4">
              <button onClick={() => setStep(2)} className="px-8 py-4 border border-[#E5E7EB] text-[#4B5563] font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all">
                Ajustar Mapeamento
              </button>
              <button 
                disabled={loading}
                onClick={startImport}
                className="px-12 py-4 bg-[#3A8D8F] text-white font-black text-xs uppercase tracking-[0.2em] hover:bg-[#2d6e70] disabled:opacity-50 transition-all flex items-center gap-3 shadow-xl"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                {loading ? 'Processando...' : 'Iniciar Importação'}
              </button>
            </div>
          </div>
        )}

        {step === 4 && results && (
          <div className="p-12 flex-1 flex flex-col items-center justify-center text-center space-y-8">
            <div className={cn(
              "w-20 h-20 flex items-center justify-center rounded-full",
              results.errors.length === 0 ? "bg-emerald-50 text-emerald-500" : "bg-amber-50 text-amber-500"
            )}>
              {results.errors.length === 0 ? <CheckCircle2 size={40} /> : <AlertCircle size={40} />}
            </div>
            <div className="max-w-md space-y-2">
              <h3 className="text-xl font-black text-[#0A192F] uppercase tracking-tight">Importação Finalizada</h3>
              <p className="text-sm text-[#6B7280]">
                Processamento concluído com <b>{results.success}</b> ativos criados com sucesso.
              </p>
            </div>

            {results.errors.length > 0 && (
              <div className="w-full max-w-lg bg-red-50 border border-red-100 p-6 text-left max-h-48 overflow-y-auto">
                <h4 className="text-[10px] font-black text-red-700 uppercase tracking-widest mb-3">Alertas e Erros ({results.errors.length}):</h4>
                <ul className="space-y-2">
                  {results.errors.map((err, i) => (
                    <li key={i} className="text-[10px] text-red-600 font-medium leading-relaxed">• {err}</li>
                  ))}
                </ul>
              </div>
            )}

            <button 
              onClick={onSuccess}
              className="px-12 py-4 bg-[#0A192F] text-white font-black text-xs uppercase tracking-[0.2em] hover:bg-[#112240] transition-all"
            >
              Ir para Inventário
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportWizard;
