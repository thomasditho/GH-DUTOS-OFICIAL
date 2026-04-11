import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';

interface LabelData {
  codigo: string;
  tipo: string;
  local: string;
  andar: string;
  publicId: string;
}

interface PrintSettings {
  labelWidth?: number;
  labelHeight?: number;
  labelShowCode?: boolean;
  labelShowType?: boolean;
  labelShowLocal?: boolean;
  labelPhone?: string;
  labelTemplate?: string;
  reportPrimaryColor?: string;
  logoUrl?: string;
}

export const generateBatchLabels = async (items: LabelData[], settings: PrintSettings) => {
  // GH DUTOS Standard: 80x40mm labels, 3x5 grid on A4 Landscape
  const labelWidth = settings.labelWidth || 80;
  const labelHeight = settings.labelHeight || 40;
  
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const primaryColor = settings?.reportPrimaryColor || '#0A192F';
  const hexToRgb = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b];
  };
  const rgb = hexToRgb(primaryColor);

  // A4 Landscape is 297 x 210
  // We want a 3x5 grid. Let's calculate the cell size.
  const cellWidth = 297 / 3; // 99mm
  const cellHeight = 210 / 5; // 42mm
  
  // We will fit the label inside the cell while maintaining aspect ratio
  // or just use the cell size if the provided dimensions are too big.
  const scale = Math.min(cellWidth / labelWidth, cellHeight / labelHeight, 1);
  const drawWidth = labelWidth * scale;
  const drawHeight = labelHeight * scale;
  
  const marginX = (297 - (3 * drawWidth)) / 2;
  const marginY = (210 - (5 * drawHeight)) / 2;

  let currentItem = 0;
  
  for (let i = 0; i < items.length; i++) {
    if (i > 0 && i % 15 === 0) {
      doc.addPage();
      currentItem = 0;
    }

    const col = currentItem % 3;
    const row = Math.floor(currentItem / 3);
    
    const x = marginX + col * drawWidth;
    const y = marginY + row * drawHeight;

    const item = items[i];
    const publicUrl = `${window.location.origin}/e/${item.publicId}`;
    
    // Draw Label Border
    doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
    doc.setLineWidth(0.1);
    doc.rect(x, y, drawWidth, drawHeight);

    if (settings.labelTemplate === 'classic') {
      // CLASSIC TEMPLATE (Excel Style)
      
      // QR Code at Top
      try {
        const qrSize = Math.min(drawHeight * 0.4, 20);
        const qrDataUrl = await QRCode.toDataURL(publicUrl, { margin: 1, width: 200 });
        doc.addImage(qrDataUrl, 'PNG', x + (drawWidth - qrSize) / 2, y + 4, qrSize, qrSize);
      } catch (err) {
        console.error('QR Error', err);
      }

      // Asset Code in Middle
      doc.setTextColor(rgb[0], rgb[1], rgb[2]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(drawWidth < 50 ? 12 : 18);
      doc.text(item.codigo, x + drawWidth / 2, y + drawHeight * 0.6, { align: 'center' });
      
      // Horizontal Line
      doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
      doc.setLineWidth(0.5);
      doc.line(x + drawWidth * 0.15, y + drawHeight * 0.6 + 2, x + drawWidth * 0.85, y + drawHeight * 0.6 + 2);

      // Logo at Bottom - Full Width focus
      const bottomY = y + drawHeight - 15;
      
      if (settings.logoUrl) {
        try {
          // Maximize logo size
          const logoW = 45;
          const logoH = 22;
          doc.addImage(settings.logoUrl, 'PNG', x + (drawWidth - logoW) / 2, bottomY - 5, logoW, logoH);
        } catch (e) {
          // Fallback to geometric logo if image fails
          doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
          doc.setLineWidth(0.3);
          const diamondX = x + drawWidth / 2 - 12;
          const diamondY = bottomY;
          doc.line(diamondX, diamondY + 4, diamondX + 4, diamondY);
          doc.line(diamondX + 4, diamondY, diamondX + 8, diamondY + 4);
          doc.line(diamondX + 8, diamondY + 4, diamondX + 4, diamondY + 8);
          doc.line(diamondX + 4, diamondY + 8, diamondX, diamondY + 4);
          doc.setFontSize(5);
          doc.text('GH', diamondX + 4, diamondY + 5, { align: 'center' });
          
          doc.setFontSize(6);
          doc.text('GH INSTALAÇÃO', x + drawWidth / 2 + 2, bottomY + 3);
          doc.setFontSize(6);
          doc.setFont('helvetica', 'bold');
          doc.text(settings.labelPhone || '(11) 3208-1276', x + drawWidth / 2 + 2, bottomY + 6);
        }
      } else {
        // GH Geometric Logo (Simplified for PDF)
        doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
        doc.setLineWidth(0.3);
        const diamondX = x + drawWidth / 2 - 12;
        const diamondY = bottomY;
        doc.line(diamondX, diamondY + 4, diamondX + 4, diamondY);
        doc.line(diamondX + 4, diamondY, diamondX + 8, diamondY + 4);
        doc.line(diamondX + 8, diamondY + 4, diamondX + 4, diamondY + 8);
        doc.line(diamondX + 4, diamondY + 8, diamondX, diamondY + 4);
        
        doc.setFontSize(5);
        doc.text('GH', diamondX + 4, diamondY + 5, { align: 'center' });

        doc.setFontSize(6);
        doc.text('GH INSTALAÇÃO', x + drawWidth / 2 + 2, bottomY + 3);
        doc.setFontSize(6);
        doc.setFont('helvetica', 'bold');
        doc.text(settings.labelPhone || '(11) 3208-1276', x + drawWidth / 2 + 2, bottomY + 6);
      }

    } else {
      // MODERN TEMPLATE (Current)
      
      // Green Accent Bar (Top)
      doc.setFillColor(16, 185, 129); // Emerald-500
      doc.rect(x, y, drawWidth, 1, 'F');

      // Header Bar
      doc.setFillColor(rgb[0], rgb[1], rgb[2]);
      doc.rect(x, y + 1, drawWidth, 6, 'F');
      
      // Logo or Text
      if (settings.logoUrl) {
        try {
          doc.addImage(settings.logoUrl, 'PNG', x + 4, y + 1.2, 18, 6);
        } catch (e) {
          doc.setTextColor(255, 255, 255);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(drawWidth < 50 ? 7 : 10);
          doc.text('GH DUTOS', x + 4, y + 5.5);
        }
      } else {
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(drawWidth < 50 ? 7 : 10);
        doc.text('GH DUTOS', x + 4, y + 5.5);
      }

      // ID in corner
      doc.setTextColor(255, 255, 255, 0.4);
      doc.setFontSize(5);
      doc.text(`ID: ${item.codigo}`, x + drawWidth - 4, y + 5.5, { align: 'right' });

      // QR Code
      try {
        const qrSize = Math.min(drawHeight * 0.6, 24);
        const qrDataUrl = await QRCode.toDataURL(publicUrl, { margin: 1, width: 200 });
        doc.addImage(qrDataUrl, 'PNG', x + 4, y + 10, qrSize, qrSize);
      } catch (err) {
        console.error('QR Error', err);
      }

      // Content Section
      doc.setTextColor(rgb[0], rgb[1], rgb[2]);
      const contentX = x + 35;
      let textY = y + 14;

      if (settings.labelShowCode !== false) {
        doc.setFontSize(5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(150, 150, 150);
        doc.text('CÓDIGO', contentX, textY);
        textY += 4;
        doc.setFontSize(drawWidth < 50 ? 7 : 10);
        doc.setTextColor(rgb[0], rgb[1], rgb[2]);
        doc.text(item.codigo, contentX, textY);
        textY += 6;
      }

      if (settings.labelShowType !== false) {
        doc.setFontSize(5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(150, 150, 150);
        doc.text('EQUIPAMENTO', contentX, textY);
        textY += 3.5;
        doc.setFontSize(drawWidth < 50 ? 6 : 8);
        doc.setTextColor(rgb[0], rgb[1], rgb[2]);
        const tipo = item.tipo.length > 25 ? item.tipo.substring(0, 25) + '...' : item.tipo;
        doc.text(tipo, contentX, textY);
        textY += 5.5;
      }

      if (settings.labelShowLocal !== false) {
        doc.setFontSize(5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(150, 150, 150);
        doc.text('LOCALIZAÇÃO', contentX, textY);
        textY += 3.5;
        doc.setFontSize(drawWidth < 50 ? 6 : 8);
        doc.setTextColor(rgb[0], rgb[1], rgb[2]);
        const local = `${item.local} - ${item.andar}`;
        const localTrunc = local.length > 25 ? local.substring(0, 25) + '...' : local;
        doc.text(localTrunc, contentX, textY);
      }

      // Footer
      doc.setFontSize(4);
      doc.setTextColor(150, 150, 150);
      doc.text('ghdutos.com.br', x + 4, y + drawHeight - 5);
      if (settings.labelPhone) {
        doc.setTextColor(rgb[0], rgb[1], rgb[2]);
        doc.setFont('helvetica', 'bold');
        doc.text(settings.labelPhone, x + 4, y + drawHeight - 2.5);
      }
      doc.setTextColor(rgb[0], rgb[1], rgb[2]);
      doc.setFont('helvetica', 'bold');
      doc.text('ENGENHARIA E MANUTENÇÃO', x + drawWidth - 4, y + drawHeight - 2.5, { align: 'right' });
    }

    currentItem++;
  }

  doc.save(`etiquetas-lote-${new Date().getTime()}.pdf`);
};

export const generateTestReport = (settings: PrintSettings) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const primaryColor = settings?.reportPrimaryColor || '#0A192F';
  
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
  
  if (settings?.logoUrl) {
    try {
      doc.addImage(settings.logoUrl, 'PNG', 20, 5, 45, 30);
    } catch (e) {
      console.error('Error adding logo to PDF', e);
    }
  }

  doc.setTextColor(rgb[0], rgb[1], rgb[2]);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('RELATÓRIO DE TESTE', settings?.logoUrl ? 70 : 20, 25);
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(settings?.reportHeader || '', pageWidth - 20, 15, { align: 'right' });
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth - 20, 25, { align: 'right' });

  // Mock Content
  doc.setTextColor(rgb[0], rgb[1], rgb[2]);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('EXEMPLO DE CONTEÚDO', 20, 60);
  doc.line(20, 63, 80, 63);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Este é um relatório de teste para verificar as configurações de cores, cabeçalho e rodapé.', 20, 75);

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(settings?.reportFooter || '', pageWidth / 2, 285, { align: 'center' });

  doc.save('relatorio-teste.pdf');
};
