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
  reportHeader?: string;
  reportFooter?: string;
}

// Helper to add image maintaining aspect ratio
const addImageWithAspectRatio = (
  doc: jsPDF, 
  imgUrl: string, 
  x: number, 
  y: number, 
  maxWidth: number, 
  maxHeight: number,
  align: 'left' | 'center' | 'right' = 'center'
) => {
  return new Promise<void>((resolve) => {
    const img = new Image();
    img.onload = () => {
      const ratio = img.width / img.height;
      let width = maxWidth;
      let height = width / ratio;

      if (height > maxHeight) {
        height = maxHeight;
        width = height * ratio;
      }

      let finalX = x;
      if (align === 'center') finalX = x + (maxWidth - width) / 2;
      if (align === 'right') finalX = x + (maxWidth - width);

      try {
        doc.addImage(imgUrl, 'PNG', finalX, y + (maxHeight - height) / 2, width, height);
      } catch (e) {
        console.error('Error adding image to PDF', e);
      }
      resolve();
    };
    img.onerror = () => {
      console.error('Error loading image for PDF');
      resolve();
    };
    img.src = imgUrl;
  });
};

export const generateBatchLabels = async (items: LabelData[], settings: PrintSettings) => {
  const labelWidth = settings.labelWidth || 80;
  const labelHeight = settings.labelHeight || 40;
  
  // If it's a single label, use the label dimensions
  const isSingle = items.length === 1;
  
  const doc = new jsPDF({
    orientation: isSingle ? (labelWidth > labelHeight ? 'landscape' : 'portrait') : 'landscape',
    unit: 'mm',
    format: isSingle ? [labelWidth, labelHeight] : 'a4'
  }) as any;

  // Add helper to truncate text based on width
  doc.truncateText = (text: string, maxWidth: number) => {
    const fontSize = doc.internal.getFontSize();
    const scaleFactor = doc.internal.scaleFactor;
    if ((doc.getStringUnitWidth(text) * fontSize) / scaleFactor <= maxWidth) {
      return text;
    }
    let truncated = text;
    while (truncated.length > 0 && ((doc.getStringUnitWidth(truncated + '...') * fontSize) / scaleFactor) > maxWidth) {
      truncated = truncated.substring(0, truncated.length - 1);
    }
    return truncated + '...';
  };

  const primaryColor = settings?.reportPrimaryColor || '#0A192F';
  const hexToRgb = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b];
  };
  const rgb = hexToRgb(primaryColor);

  // Grid calculation for A4
  const cellWidth = 297 / 3;
  const cellHeight = 210 / 5;
  const scale = isSingle ? 1 : Math.min(cellWidth / labelWidth, cellHeight / labelHeight, 0.95);
  const drawWidth = labelWidth * scale;
  const drawHeight = labelHeight * scale;
  
  const marginX = isSingle ? 0 : (297 - (3 * drawWidth)) / 2;
  const marginY = isSingle ? 0 : (210 - (5 * drawHeight)) / 2;

  let currentItem = 0;
  
  for (let i = 0; i < items.length; i++) {
    if (!isSingle && i > 0 && i % 15 === 0) {
      doc.addPage();
      currentItem = 0;
    }

    const col = isSingle ? 0 : currentItem % 3;
    const row = isSingle ? 0 : Math.floor(currentItem / 3);
    
    const x = marginX + col * drawWidth;
    const y = marginY + row * drawHeight;

    const item = items[i];
    const publicUrl = `${window.location.origin}/e/${item.publicId}`;
    
    // Draw Label Border (optional for single, required for grid)
    if (!isSingle) {
      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(0.1);
      doc.rect(x, y, drawWidth, drawHeight);
    }

    if (settings.labelTemplate === 'classic') {
      // CLASSIC TEMPLATE
      
      // QR Code at Top
      try {
        const safeMargin = drawHeight * 0.08;
        const qrSize = drawHeight * 0.28;
        const qrDataUrl = await QRCode.toDataURL(publicUrl, { margin: 1, width: 200 });
        doc.addImage(qrDataUrl, 'PNG', x + (drawWidth - qrSize) / 2, y + safeMargin, qrSize, qrSize);
      } catch (err) {
        console.error('QR Error', err);
      }

      // Asset Code in Middle
      doc.setTextColor(rgb[0], rgb[1], rgb[2]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(drawHeight * 0.28);
      doc.text(item.codigo, x + drawWidth / 2, y + drawHeight * 0.48, { align: 'center' });
      
      // Horizontal Line
      doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
      doc.setLineWidth(0.5);
      doc.line(x + drawWidth * 0.1, y + drawHeight * 0.48 + 2, x + drawWidth * 0.9, y + drawHeight * 0.48 + 2);

      // Logo at Bottom
      const logoAreaY = y + drawHeight * 0.58;
      const logoAreaH = drawHeight * 0.34;
      
      if (settings.logoUrl) {
        await addImageWithAspectRatio(doc, settings.logoUrl, x + 5, logoAreaY, drawWidth - 10, logoAreaH);
      } else {
        // Fallback Geometric Logo
        doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
        doc.setLineWidth(0.3);
        const diamondX = x + drawWidth / 2 - 15;
        const diamondY = logoAreaY + 2;
        doc.line(diamondX, diamondY + 4, diamondX + 4, diamondY);
        doc.line(diamondX + 4, diamondY, diamondX + 8, diamondY + 4);
        doc.line(diamondX + 8, diamondY + 4, diamondX + 4, diamondY + 8);
        doc.line(diamondX + 4, diamondY + 8, diamondX, diamondY + 4);
        doc.setFontSize(5);
        doc.text('GH', diamondX + 4, diamondY + 5, { align: 'center' });
        doc.setFontSize(7);
        doc.text('GH INSTALAÇÃO', x + drawWidth / 2 + 2, diamondY + 3);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.text(settings.labelPhone || '(11) 3208-1276', x + drawWidth / 2 + 2, diamondY + 7);
      }

    } else {
      // MODERN TEMPLATE
      
      // Green Accent Bar
      doc.setFillColor(16, 185, 129);
      doc.rect(x, y, drawWidth, 1, 'F');

      // Header Bar
      doc.setFillColor(rgb[0], rgb[1], rgb[2]);
      doc.rect(x, y + 1, drawWidth, 7, 'F');
      
      // Logo in Header
      if (settings.logoUrl) {
        await addImageWithAspectRatio(doc, settings.logoUrl, x + 4, y + 1.5, 20, 6, 'left');
      } else {
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('GH DUTOS', x + 4, y + 6);
      }

      // ID in corner
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(5);
      doc.text(`ID: ${item.codigo}`, x + drawWidth - 4, y + 6, { align: 'right' });

      // QR Code
      try {
        const qrSize = drawHeight * 0.55;
        const qrDataUrl = await QRCode.toDataURL(publicUrl, { margin: 1, width: 200 });
        doc.addImage(qrDataUrl, 'PNG', x + 4, y + 11, qrSize, qrSize);
      } catch (err) {
        console.error('QR Error', err);
      }

      // Content Section
      doc.setTextColor(rgb[0], rgb[1], rgb[2]);
      const contentX = x + (drawWidth * 0.42);
      const maxTextWidth = drawWidth * 0.52; // Prevent overlap with right-aligned footer
      let textY = y + 15;

      if (settings.labelShowCode !== false) {
        doc.setFontSize(5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(150, 150, 150);
        doc.text('CÓDIGO', contentX, textY);
        textY += 4;
        doc.setFontSize(9);
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
        doc.setFontSize(7);
        doc.setTextColor(rgb[0], rgb[1], rgb[2]);
        const tipo = doc.truncateText(item.tipo, maxTextWidth);
        doc.text(tipo, contentX, textY);
        textY += 5.5;
      }

      if (settings.labelShowLocal !== false) {
        doc.setFontSize(5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(150, 150, 150);
        doc.text('LOCALIZAÇÃO', contentX, textY);
        textY += 3.5;
        doc.setFontSize(7);
        doc.setTextColor(rgb[0], rgb[1], rgb[2]);
        const local = `${item.local} - ${item.andar}`;
        const localTrunc = doc.truncateText(local, maxTextWidth);
        doc.text(localTrunc, contentX, textY);
      }

      // Footer
      doc.setFontSize(4.5);
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

  doc.save(isSingle ? `etiqueta-${items[0].codigo}.pdf` : `etiquetas-lote-${new Date().getTime()}.pdf`);
};

export const generateTestReport = async (settings: PrintSettings) => {
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
    await addImageWithAspectRatio(doc, settings.logoUrl, 20, 5, 45, 30, 'left');
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
