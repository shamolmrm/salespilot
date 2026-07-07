import type { Decimal } from '@prisma/client/runtime/library';

function sanitize(s: unknown): string {
  if (s == null) return '';
  return String(s).replace(/[\x00-\x1F\x7F-\x9F]/g, ' ').slice(0, 2000);
}

function fmtMoney(amount: number | Decimal, currency: string): string {
  return Number(amount).toLocaleString('en-US', { style: 'currency', currency });
}

interface LineItem {
  description: string;
  quantity: number | Decimal;
  unitPrice: number | Decimal;
  discount: number | Decimal;
  total: number | Decimal;
}

interface DocData {
  type: 'QUOTATION' | 'INVOICE';
  number: string;
  date: Date;
  dueDate?: Date | null;
  validUntil?: Date | null;
  status: string;
  currency: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  companyName?: string;
  items: LineItem[];
  subtotal: number | Decimal;
  discount: number | Decimal;
  discountType: string;
  taxRate: number | Decimal;
  taxAmount: number | Decimal;
  total: number | Decimal;
  amountPaid?: number | Decimal;
  amountDue?: number | Decimal;
  notes?: string | null;
  terms?: string | null;
}

export async function generatePDF(data: DocData): Promise<Buffer> {
  const PDFDocument = (await import('pdfkit')).default;
  const chunks: Buffer[] = [];

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const W = 495; // usable width
    const blue = '#2563eb';
    const gray = '#6b7280';
    const light = '#f3f4f6';

    // Header bar
    doc.rect(50, 50, W, 60).fill(blue);
    doc.fillColor('white').fontSize(22).font('Helvetica-Bold')
      .text(sanitize(data.type === 'QUOTATION' ? 'Quotation' : 'Invoice'), 60, 68);
    doc.fontSize(10).font('Helvetica').text(`#${sanitize(data.number)}`, 60, 92);

    // Status badge (top right)
    doc.fillColor(blue).fontSize(9).font('Helvetica-Bold')
      .text(sanitize(data.status), 450, 75, { width: 90, align: 'right' });

    // Date / Due
    doc.fillColor('#111827').fontSize(10).font('Helvetica').moveDown(3);
    const dateY = 130;
    doc.text(`Date: ${data.date.toLocaleDateString()}`, 50, dateY);
    if (data.dueDate) doc.text(`Due: ${data.dueDate.toLocaleDateString()}`, 200, dateY);
    if (data.validUntil) doc.text(`Valid until: ${data.validUntil.toLocaleDateString()}`, 200, dateY);

    // Bill to
    let y = dateY + 25;
    doc.fillColor(gray).fontSize(9).font('Helvetica-Bold').text('BILL TO', 50, y);
    y += 14;
    doc.fillColor('#111827').font('Helvetica').fontSize(10);
    if (data.customerName) { doc.text(sanitize(data.customerName), 50, y); y += 14; }
    if (data.companyName) { doc.text(sanitize(data.companyName), 50, y); y += 14; }
    if (data.customerEmail) { doc.text(sanitize(data.customerEmail), 50, y); y += 14; }
    if (data.customerPhone) { doc.text(sanitize(data.customerPhone), 50, y); y += 14; }

    // Line items table header
    y += 10;
    doc.rect(50, y, W, 20).fill(light);
    doc.fillColor(gray).fontSize(9).font('Helvetica-Bold');
    doc.text('Description', 55, y + 5);
    doc.text('Qty', 330, y + 5, { width: 50, align: 'right' });
    doc.text('Unit Price', 385, y + 5, { width: 65, align: 'right' });
    doc.text('Total', 455, y + 5, { width: 90, align: 'right' });

    // Line items
    y += 22;
    doc.fillColor('#111827').font('Helvetica').fontSize(9);
    for (const item of data.items) {
      const itemY = y;
      const desc = sanitize(item.description);
      const descHeight = doc.heightOfString(desc, { width: 270 });
      const rowHeight = Math.max(18, descHeight + 8);

      if (y + rowHeight > 750) {
        doc.addPage();
        y = 50;
      }

      doc.text(desc, 55, y, { width: 270 });
      doc.text(String(Number(item.quantity)), 330, itemY, { width: 50, align: 'right' });
      doc.text(fmtMoney(item.unitPrice, data.currency), 385, itemY, { width: 65, align: 'right' });
      doc.text(fmtMoney(item.total, data.currency), 455, itemY, { width: 90, align: 'right' });

      y += rowHeight;
      doc.moveTo(50, y).lineTo(545, y).strokeColor('#e5e7eb').lineWidth(0.5).stroke();
      y += 2;
    }

    // Totals
    y += 8;
    const totY = y;
    const totX = 350;
    const totW = 195;
    doc.fillColor(gray).fontSize(9).font('Helvetica');

    const addRow = (label: string, value: string, bold = false) => {
      doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fillColor(bold ? '#111827' : gray)
        .text(label, totX, y, { width: totW / 2 });
      doc.text(value, totX + totW / 2, y, { width: totW / 2, align: 'right' });
      y += 16;
    };

    addRow('Subtotal', fmtMoney(data.subtotal, data.currency));
    if (Number(data.discount) > 0) {
      const discLabel = data.discountType === 'PERCENTAGE'
        ? `Discount (${Number(data.taxRate)}%)`
        : 'Discount';
      addRow(discLabel, `−${fmtMoney(data.discount, data.currency)}`);
    }
    if (Number(data.taxRate) > 0) {
      addRow(`Tax (${Number(data.taxRate)}%)`, fmtMoney(data.taxAmount, data.currency));
    }

    doc.moveTo(totX, y).lineTo(545, y).strokeColor('#d1d5db').lineWidth(0.5).stroke();
    y += 6;
    addRow('Total', fmtMoney(data.total, data.currency), true);

    if (data.amountPaid !== undefined && Number(data.amountPaid) > 0) {
      addRow('Amount Paid', fmtMoney(data.amountPaid, data.currency));
      y += 2;
      doc.rect(totX, y, totW, 20).fill('#dcfce7');
      doc.fillColor('#166534').font('Helvetica-Bold').fontSize(9)
        .text('Amount Due', totX + 4, y + 5, { width: totW / 2 });
      doc.text(fmtMoney(data.amountDue ?? 0, data.currency), totX + totW / 2, y + 5, { width: totW / 2 - 4, align: 'right' });
      y += 26;
    }

    // Notes & Terms
    if (data.notes) {
      y = Math.max(y, totY) + 20;
      if (y > 700) { doc.addPage(); y = 50; }
      doc.fillColor(gray).fontSize(8).font('Helvetica-Bold').text('NOTES', 50, y);
      y += 12;
      doc.fillColor('#374151').font('Helvetica').fontSize(9).text(sanitize(data.notes), 50, y, { width: W });
      y += doc.heightOfString(sanitize(data.notes), { width: W }) + 8;
    }
    if (data.terms) {
      if (y > 700) { doc.addPage(); y = 50; }
      doc.fillColor(gray).fontSize(8).font('Helvetica-Bold').text('TERMS & CONDITIONS', 50, y);
      y += 12;
      doc.fillColor('#374151').font('Helvetica').fontSize(9).text(sanitize(data.terms), 50, y, { width: W });
    }

    doc.end();
  });
}
