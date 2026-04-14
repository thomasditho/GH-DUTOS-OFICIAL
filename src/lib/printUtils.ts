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
  labelQrSize?: number;
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
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const labelWidth = settings.labelWidth || 80;
  const labelHeight = settings.labelHeight || 40;
  const qrScale = (settings.labelQrSize || 40) / 100;

  // Ensure we have at least 1 col and 1 row if label is larger than page
  const cols = Math.max(1, Math.floor(pageWidth / labelWidth));
  const rows = Math.max(1, Math.floor(pageHeight / labelHeight));
  const itemsPerPage = cols * rows;

  const marginX = Math.max(0, (pageWidth - (cols * labelWidth)) / 2);
  const marginY = Math.max(0, (pageHeight - (rows * labelHeight)) / 2);

  try {
    for (let i = 0; i < items.length; i++) {
      if (i > 0 && i % itemsPerPage === 0) {
        doc.addPage();
      }

      const item = items[i];
      const pageIndex = i % itemsPerPage;
      const col = pageIndex % cols;
      const row = Math.floor(pageIndex / cols);

      const x = marginX + (col * labelWidth);
      const y = marginY + (row * labelHeight);

      // Draw Label Border (optional, but good for cutting)
      doc.setDrawColor(230, 230, 230);
      doc.setLineWidth(0.1);
      doc.rect(x, y, labelWidth, labelHeight);

      // 1. QR Code at Top
      const qrSize = labelHeight * qrScale;
      const qrX = x + (labelWidth - qrSize) / 2;
      const qrY = y + (labelHeight * 0.05); // 5% padding at top

      const publicUrl = `https://ghdutos.com.br/asset/${item.publicId}`;
      const qrDataUrl = await QRCode.toDataURL(publicUrl, { 
        margin: 1,
        width: 200,
        color: { dark: '#0A192F', light: '#FFFFFF' }
      });
      doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);

      // 2. Asset Code
      if (settings.labelShowCode !== false) {
        const fontSize = Math.max(6, labelHeight * 0.12);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(fontSize);
        doc.setTextColor(10, 25, 47); // #0A192F
        doc.text(item.codigo, x + labelWidth / 2, qrY + qrSize + (labelHeight * 0.08), { align: 'center' });
      }

      // 3. Horizontal Line
      const lineY = qrY + qrSize + (labelHeight * 0.12);
      doc.setDrawColor(10, 25, 47);
      doc.setLineWidth(0.3);
      doc.line(x + (labelWidth * 0.1), lineY, x + (labelWidth * 0.9), lineY);

      // 4. Logo at Bottom
      const logoAreaTop = lineY + 1;
      const logoAreaHeight = labelHeight - (logoAreaTop - y) - (labelHeight * 0.05);
      
      if (settings.logoUrl) {
        await addImageWithAspectRatio(
          doc, 
          settings.logoUrl, 
          x + (labelWidth * 0.1), 
          logoAreaTop, 
          labelWidth * 0.8, 
          logoAreaHeight
        );
      } else {
        // Fallback text if no logo
        doc.setFontSize(Math.max(5, labelHeight * 0.08));
        doc.setFont('helvetica', 'bold');
        doc.text('GH DUTOS', x + labelWidth / 2, logoAreaTop + (logoAreaHeight / 2), { align: 'center' });
      }
    }

    const fileName = items.length === 1 ? `etiqueta-${items[0].codigo}.pdf` : 'etiquetas-lote.pdf';
    doc.save(fileName);
  } catch (error) {
    console.error('Error generating labels:', error);
    throw error;
  }
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
