import { Injectable, NotFoundException } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import * as QRCode from 'qrcode';
import { PaymentsService } from '../payments/payments.service';
import { MembersService } from '../members/members.service';
import { ChitsService } from '../chits/chits.service';
import { CurrencyUtil } from '../../common/utils/currency.util';

@Injectable()
export class DocumentsService {
  constructor(
    private paymentsService: PaymentsService,
    private membersService: MembersService,
    private chitsService: ChitsService,
  ) {}

  /**
   * Generates a professional financial PDF receipt stream with QR verification
   */
  async generateReceiptPdf(paymentId: string): Promise<Buffer> {
    const receiptData = await this.paymentsService.getReceiptData(paymentId);
    const qrPayload = JSON.stringify({
      receiptNumber: receiptData.receiptNumber,
      amount: receiptData.amount,
      memberCode: receiptData.member.code,
      date: receiptData.date,
      chitCode: receiptData.chit?.code,
    });

    const qrDataUrl = await QRCode.toDataURL(qrPayload, { margin: 1, width: 120 });
    const qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40, size: 'A5', layout: 'portrait' });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // --- HEADER ---
      doc.fontSize(18).fillColor('#059669').text('eChits Financial Operations', { align: 'center' });
      doc.fontSize(9).fillColor('#64748b').text('Authorized Chit Management & Collection Platform', { align: 'center' });
      doc.moveDown(0.5);
      doc.strokeColor('#e2e8f0').lineWidth(1).moveTo(40, doc.y).lineTo(doc.page.width - 40, doc.y).stroke();
      doc.moveDown(0.8);

      // --- RECEIPT METADATA BOX ---
      const topY = doc.y;
      doc.fontSize(12).fillColor('#0f172a').font('Helvetica-Bold').text(`RECEIPT: ${receiptData.receiptNumber}`, 40, topY);
      doc.fontSize(9).font('Helvetica').fillColor('#475569')
        .text(`Date: ${new Date(receiptData.date).toLocaleString('en-IN')}`, 40, topY + 18)
        .text(`Payment Mode: ${receiptData.paymentMode}`, 40, topY + 32)
        .text(`Collected By: ${receiptData.collectedBy.name} (${receiptData.collectedBy.role})`, 40, topY + 46);

      if (receiptData.referenceNumber) {
        doc.text(`Reference: ${receiptData.referenceNumber}`, 40, topY + 60);
      }

      // QR Code on the right
      doc.image(qrBuffer, doc.page.width - 130, topY - 5, { width: 90 });
      doc.y = topY + 80;

      // --- MEMBER & CHIT DETAILS ---
      doc.strokeColor('#e2e8f0').lineWidth(0.5).moveTo(40, doc.y).lineTo(doc.page.width - 40, doc.y).stroke();
      doc.moveDown(0.5);

      doc.fontSize(10).font('Helvetica-Bold').fillColor('#0f172a').text('Member Details:', 40);
      doc.fontSize(9).font('Helvetica').fillColor('#334155')
        .text(`Name: ${receiptData.member.name} (${receiptData.member.code})`)
        .text(`Phone: ${receiptData.member.phone}`)
        .text(`Address: ${receiptData.member.address || 'N/A'}`);

      if (receiptData.chit) {
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#0f172a').text('Chit Scheme:');
        doc.fontSize(9).font('Helvetica').fillColor('#334155')
          .text(`Group: ${receiptData.chit.name} [${receiptData.chit.code}]`)
          .text(`Total Scheme Value: ${CurrencyUtil.formatINR(receiptData.chit.totalValue)}`);
      }

      doc.moveDown(0.8);

      // --- ALLOCATION BREAKDOWN TABLE ---
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#0f172a').text('Payment Allocation Breakdown:');
      doc.moveDown(0.3);

      const tableTop = doc.y;
      doc.fontSize(8).font('Helvetica-Bold').fillColor('#475569');
      doc.text('Month / Item', 40, tableTop);
      doc.text('Principal', 150, tableTop, { width: 60, align: 'right' });
      doc.text('Interest', 220, tableTop, { width: 50, align: 'right' });
      doc.text('Late Fee', 280, tableTop, { width: 50, align: 'right' });
      doc.text('Allocated', 340, tableTop, { width: 60, align: 'right' });

      doc.strokeColor('#cbd5e1').lineWidth(0.5).moveTo(40, tableTop + 14).lineTo(doc.page.width - 40, tableTop + 14).stroke();

      let rowY = tableTop + 20;
      doc.font('Helvetica').fontSize(8).fillColor('#1e293b');

      receiptData.allocationBreakdown.forEach((item) => {
        doc.text(`Month #${item.monthSequence} (${item.calendarMonth}/${item.calendarYear})`, 40, rowY);
        doc.text(CurrencyUtil.formatINR(item.principalPaid, false), 150, rowY, { width: 60, align: 'right' });
        doc.text(CurrencyUtil.formatINR(item.interestPaid, false), 220, rowY, { width: 50, align: 'right' });
        doc.text(CurrencyUtil.formatINR(item.feePaid, false), 280, rowY, { width: 50, align: 'right' });
        doc.text(CurrencyUtil.formatINR(item.totalAllocated, false), 340, rowY, { width: 60, align: 'right' });
        rowY += 16;
      });

      if (receiptData.advanceAmount > 0) {
        doc.text('Credited to Member Advance', 40, rowY);
        doc.text('-', 150, rowY, { width: 60, align: 'right' });
        doc.text('-', 220, rowY, { width: 50, align: 'right' });
        doc.text('-', 280, rowY, { width: 50, align: 'right' });
        doc.text(CurrencyUtil.formatINR(receiptData.advanceAmount, false), 340, rowY, { width: 60, align: 'right' });
        rowY += 16;
      }

      doc.strokeColor('#0f172a').lineWidth(1).moveTo(40, rowY + 2).lineTo(doc.page.width - 40, rowY + 2).stroke();
      rowY += 8;

      // --- TOTALS ---
      doc.font('Helvetica-Bold').fontSize(11).fillColor('#059669');
      doc.text('TOTAL AMOUNT RECEIVED:', 40, rowY);
      doc.text(CurrencyUtil.formatINR(receiptData.amount), 280, rowY, { width: 120, align: 'right' });

      rowY += 18;
      doc.font('Helvetica').fontSize(9).fillColor('#64748b');
      doc.text(`Remaining Balance in Scheme: ${CurrencyUtil.formatINR(receiptData.remainingChitBalance)}`, 40, rowY);

      if (receiptData.isReversed) {
        doc.moveDown(1);
        doc.fontSize(12).font('Helvetica-Bold').fillColor('#dc2626')
          .text('*** TRANSACTION REVERSED / VOID ***', { align: 'center' });
      }

      // --- FOOTER ---
      doc.fontSize(8).fillColor('#94a3b8').text(
        'This is a computer generated verifiable receipt. No physical signature required.',
        40,
        doc.page.height - 40,
        { align: 'center', width: doc.page.width - 80 },
      );

      doc.end();
    });
  }
}
