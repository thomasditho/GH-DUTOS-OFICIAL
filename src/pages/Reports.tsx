import React, { useState, useEffect } from 'react';
import { FileText, Download, Filter, Calendar, Building2, Loader2, CheckCircle2 } from 'lucide-react';
import { fetchApi } from '../services/api';
import { formatDate } from '../lib/utils';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const Reports: React.FC = () => {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    clientId: '',
    startDate: '',
    endDate: ''
  });
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    fetchApi('/api/clients').then(setClients).catch(() => {});
  }, []);

  const generateReport = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams(filters).toString();
      const result = await fetchApi(`/api/reports/maintenance-summary?${query}`);
      setData(result);
    } catch (err) {
      console.error('Error generating report', err);
    } finally {
      setLoading(false);
    }
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    doc.setFillColor(10, 25, 47);
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('RELATÓRIO DE MANUTENÇÕES', 20, 25);
    
    doc.setFontSize(8);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, pageWidth - 20, 25, { align: 'right' });

    const tableData = data.map(m => [
      formatDate(m.data),
      m.equipment.codigo,
      m.equipment.tipo,
      m.equipment.client?.name || 'N/A',
      m.responsavel,
      m.descricao
    ]);

    autoTable(doc, {
      startY: 50,
      head: [['DATA', 'CÓDIGO', 'TIPO', 'CLIENTE', 'TÉCNICO', 'SERVIÇO']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [10, 25, 47], fontSize: 8 },
      bodyStyles: { fontSize: 7 },
      columnStyles: {
        5: { cellWidth: 60 }
      }
    });

    doc.save(`relatorio-manutencoes-${new Date().getTime()}.pdf`);
  };

  const exportExcel = () => {
    const exportData = data.map(m => ({
      'Data': formatDate(m.data),
      'Código': m.equipment.codigo,
      'Tipo': m.equipment.tipo,
      'Cliente': m.equipment.client?.name || 'N/A',
      'Local': `${m.equipment.local} (${m.equipment.andar})`,
      'Responsável': m.responsavel,
      'Descrição': m.descricao,
      'Observações': m.observacao || ''
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Manutenções');
    XLSX.writeFile(wb, `relatorio-manutencoes-${new Date().getTime()}.xlsx`);
  };

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-3xl font-black text-[#0A192F] tracking-tighter uppercase">Central de Relatórios</h2>
        <p className="text-[#6B7280] text-xs font-bold uppercase tracking-widest mt-1">Gere documentos analíticos e históricos</p>
      </header>

      <div className="bg-white border border-[#E5E7EB] shadow-sm">
        <div className="p-4 border-b border-[#E5E7EB] bg-[#F9FAFB] flex items-center gap-2">
          <Filter size={16} className="text-[#0A192F]" />
          <h3 className="text-xs font-black text-[#0A192F] uppercase tracking-[0.2em]">Filtros de Extração</h3>
        </div>
        <div className="p-8 grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-[#6B7280] uppercase tracking-widest flex items-center gap-2">
              <Building2 size={12} /> Cliente
            </label>
            <select 
              className="w-full px-4 py-3 bg-slate-50 border border-[#E5E7EB] text-xs font-bold uppercase tracking-widest focus:border-[#3A8D8F] outline-none"
              value={filters.clientId}
              onChange={e => setFilters({...filters, clientId: e.target.value})}
            >
              <option value="">TODOS OS CLIENTES</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-[#6B7280] uppercase tracking-widest flex items-center gap-2">
              <Calendar size={12} /> Data Inicial
            </label>
            <input 
              type="date"
              className="w-full px-4 py-3 bg-slate-50 border border-[#E5E7EB] text-xs font-bold focus:border-[#3A8D8F] outline-none"
              value={filters.startDate}
              onChange={e => setFilters({...filters, startDate: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-[#6B7280] uppercase tracking-widest flex items-center gap-2">
              <Calendar size={12} /> Data Final
            </label>
            <input 
              type="date"
              className="w-full px-4 py-3 bg-slate-50 border border-[#E5E7EB] text-xs font-bold focus:border-[#3A8D8F] outline-none"
              value={filters.endDate}
              onChange={e => setFilters({...filters, endDate: e.target.value})}
            />
          </div>
          <button 
            onClick={generateReport}
            disabled={loading}
            className="px-8 py-4 bg-[#0A192F] text-white font-black text-xs uppercase tracking-[0.2em] hover:bg-[#112240] transition-all flex items-center justify-center gap-3 shadow-lg"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <FileText size={18} />}
            {loading ? 'PROCESSANDO...' : 'GERAR RELATÓRIO'}
          </button>
        </div>
      </div>

      {data.length > 0 && (
        <div className="bg-white border border-[#E5E7EB] shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="p-4 border-b border-[#E5E7EB] bg-[#F9FAFB] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-500" />
              <h3 className="text-xs font-black text-[#0A192F] uppercase tracking-[0.2em]">Resultados Encontrados ({data.length})</h3>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={exportExcel}
                className="px-4 py-2 border-2 border-[#E5E7EB] text-[10px] font-black text-[#4B5563] hover:bg-slate-50 uppercase tracking-widest transition-all flex items-center gap-2"
              >
                <Download size={14} /> EXCEL
              </button>
              <button 
                onClick={exportPDF}
                className="px-4 py-2 bg-[#3A8D8F] text-white text-[10px] font-black hover:bg-[#2d6e70] uppercase tracking-widest flex items-center gap-2 shadow-md"
              >
                <Download size={14} /> PDF
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-[#E5E7EB]">
                  <th className="px-6 py-4 text-[10px] font-black text-[#9CA3AF] uppercase tracking-widest">Data</th>
                  <th className="px-6 py-4 text-[10px] font-black text-[#9CA3AF] uppercase tracking-widest">Ativo</th>
                  <th className="px-6 py-4 text-[10px] font-black text-[#9CA3AF] uppercase tracking-widest">Cliente</th>
                  <th className="px-6 py-4 text-[10px] font-black text-[#9CA3AF] uppercase tracking-widest">Técnico</th>
                  <th className="px-6 py-4 text-[10px] font-black text-[#9CA3AF] uppercase tracking-widest">Serviço</th>
                </tr>
              </thead>
              <tbody>
                {data.map((m) => (
                  <tr key={m.id} className="border-b border-[#F3F4F6] hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-xs font-bold text-[#0A192F]">{formatDate(m.data)}</td>
                    <td className="px-6 py-4">
                      <div className="text-xs font-black text-[#0A192F]">{m.equipment.codigo}</div>
                      <div className="text-[9px] text-[#9CA3AF] font-bold uppercase">{m.equipment.tipo}</div>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-[#4B5563]">{m.equipment.client?.name || 'N/A'}</td>
                    <td className="px-6 py-4 text-xs font-bold text-[#4B5563]">{m.responsavel}</td>
                    <td className="px-6 py-4 text-xs text-[#6B7280] max-w-xs truncate">{m.descricao}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
