// backend/receipts.ts
import type { Request, Response } from 'express';
import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { v4 as uuid } from 'uuid';
import PDFDocument from 'pdfkit';

type ReceiptItem = { desc: string; qty: number; unitPrice: number };
type Receipt = {
  id: string;
  date: string;           // ISO
  payee: string;          // store/vendor
  payer?: string;         // your org / family
  currency: string;       // "USD"
  items: ReceiptItem[];
  tax?: number;           // 0..1 (e.g., 0.07)
  notes?: string;
  createdBy?: string;     // x-user-id (optional)
};

function ensureDir(p: string) {
  fs.mkdirSync(p, { recursive: true });
}

export function receiptsRouter(filesDir: string) {
  const router = Router();
  const dbDir = path.resolve(filesDir || './uploads');
  ensureDir(dbDir);
  const dbPath = path.join(dbDir, 'receipts.json');

  function readAll(): Receipt[] {
    try { return JSON.parse(fs.readFileSync(dbPath, 'utf8') || '[]'); }
    catch { return []; }
  }
  function writeAll(rows: Receipt[]) {
    fs.writeFileSync(dbPath, JSON.stringify(rows, null, 2));
  }
  function totals(r: Receipt) {
    const sub = r.items.reduce((s, it) => s + it.qty * it.unitPrice, 0);
    const taxAmt = r.tax ? sub * r.tax : 0;
    const total = sub + taxAmt;
    return { subtotal: sub, taxAmount: taxAmt, total };
  }

  // List
  router.get('/', (req: Request, res: Response) => {
    res.json(readAll());
  });

  // Create
  router.post('/', (req: Request, res: Response) => {
    const body = req.body as Partial<Receipt>;
    const row: Receipt = {
      id: uuid(),
      date: body.date || new Date().toISOString(),
      payee: body.payee || 'Unknown',
      payer: body.payer || 'CareCircle',
      currency: body.currency || 'USD',
      items: (body.items || []).map(i => ({ desc: i!.desc || '', qty: Number(i!.qty || 1), unitPrice: Number(i!.unitPrice || 0) })),
      tax: typeof body.tax === 'number' ? body.tax : 0,
      notes: body.notes || '',
      createdBy: (req.headers['x-user-id'] as string) || undefined,
    };
    const rows = readAll();
    rows.unshift(row);
    writeAll(rows);
    res.status(201).json(row);
  });

  // Read one
  router.get('/:id', (req: Request, res: Response) => {
    const rows = readAll();
    const row = rows.find(r => r.id === req.params.id);
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
  });

  // Update
  router.put('/:id', (req: Request, res: Response) => {
    const rows = readAll();
    const idx = rows.findIndex(r => r.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    const cur = rows[idx];
    const body = req.body as Partial<Receipt>;
    rows[idx] = {
      ...cur,
      ...body,
      items: (body.items ?? cur.items).map(i => ({ desc: i!.desc || '', qty: Number(i!.qty || 1), unitPrice: Number(i!.unitPrice || 0) })),
    };
    writeAll(rows);
    res.json(rows[idx]);
  });

  // Delete
  router.delete('/:id', (req: Request, res: Response) => {
    const rows = readAll();
    const next = rows.filter(r => r.id !== req.params.id);
    if (next.length === rows.length) return res.status(404).json({ error: 'Not found' });
    writeAll(next);
    res.json({ ok: true });
  });

  // Invoice PDF
  router.get('/:id/invoice.pdf', (req: Request, res: Response) => {
    const rows = readAll();
    const row = rows.find(r => r.id === req.params.id);
    if (!row) return res.status(404).json({ error: 'Not found' });

    const { subtotal, taxAmount, total } = totals(row);
    const doc = new PDFDocument({ size: 'LETTER', margin: 54 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="invoice-${row.id}.pdf"`);

    doc.fontSize(18).text('CareCircle — Invoice', { align: 'right' });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor('#666').text(`Invoice ID: ${row.id}`);
    doc.text(`Date: ${new Date(row.date).toLocaleString()}`);
    doc.moveDown();
    doc.fillColor('#000').fontSize(12).text(`Billed To: ${row.payer || 'CareCircle'}`);
    doc.text(`Payee: ${row.payee}`);
    doc.moveDown();

    // Table header
    doc.font('Helvetica-Bold').text('Description', 54, doc.y, { continued: true });
    doc.text('Qty', 300, doc.y, { continued: true });
    doc.text('Unit', 350, doc.y, { continued: true });
    doc.text('Amount', 430);
    doc.moveTo(54, doc.y + 2).lineTo(558, doc.y + 2).stroke();
    doc.moveDown(0.5);
    doc.font('Helvetica');

    row.items.forEach(it => {
      const amt = it.qty * it.unitPrice;
      doc.text(it.desc || '-', 54, doc.y, { continued: true });
      doc.text(String(it.qty), 300, doc.y, { continued: true });
      doc.text(`${row.currency} ${it.unitPrice.toFixed(2)}`, 350, doc.y, { continued: true });
      doc.text(`${row.currency} ${amt.toFixed(2)}`, 430);
    });

    doc.moveDown();
    doc.moveTo(354, doc.y).lineTo(558, doc.y).stroke();
    doc.moveDown(0.2);
    const line = (label: string, val: number) => {
      doc.text(label, 354, doc.y, { continued: true });
      doc.text(`${row.currency} ${val.toFixed(2)}`, 430);
    };
    line('Subtotal:', subtotal);
    line(`Tax${row.tax ? ` (${(row.tax * 100).toFixed(1)}%)` : ''}:`, taxAmount);
    line('Total:', total);

    if (row.notes) {
      doc.moveDown();
      doc.fontSize(10).fillColor('#555').text(`Notes: ${row.notes}`);
      doc.fillColor('#000');
    }

    doc.end();
    doc.pipe(res);
  });

  return router;
}

