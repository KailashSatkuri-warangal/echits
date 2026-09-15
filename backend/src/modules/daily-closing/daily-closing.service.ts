import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { DailyClosing } from '../../entities/daily-closing.entity';
import { Payment } from '../../entities/payment.entity';
import { CreateDailyClosingDto, ReconcileDailyClosingDto } from './dto/create-closing.dto';
import { AuditService } from '../audit/audit.service';
import { AuditAction, DailyClosingStatus, PaymentMode } from '../../common/enums';
import { CurrencyUtil } from '../../common/utils/currency.util';

@Injectable()
export class DailyClosingService {
  constructor(
    @InjectRepository(DailyClosing)
    private closingRepo: Repository<DailyClosing>,
    @InjectRepository(Payment)
    private paymentRepo: Repository<Payment>,
    private auditService: AuditService,
  ) {}

  async findAll() {
    return this.closingRepo.find({
      relations: ['openedByUser', 'closedByUser'],
      order: { closingDate: 'DESC' },
    });
  }

  async getClosingForDate(dateStr: string, actorId?: string) {
    let closing = await this.closingRepo.findOne({
      where: { closingDate: dateStr },
      relations: ['openedByUser', 'closedByUser'],
    });

    const startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
    const endOfDay = new Date(`${dateStr}T23:59:59.999Z`);

    const payments = await this.paymentRepo.find({
      where: {
        collectedAt: Between(startOfDay, endOfDay),
        isReversed: false,
      },
      relations: ['member', 'chit', 'collectedByUser'],
    });

    let cash = 0;
    let upi = 0;
    let bank = 0;
    let cheque = 0;
    let other = 0;

    payments.forEach((p) => {
      const amt = parseFloat(p.totalAmount as any) || 0;
      switch (p.paymentMode) {
        case PaymentMode.CASH:
          cash = CurrencyUtil.add(cash, amt);
          break;
        case PaymentMode.UPI:
          upi = CurrencyUtil.add(upi, amt);
          break;
        case PaymentMode.BANK_TRANSFER:
          bank = CurrencyUtil.add(bank, amt);
          break;
        case PaymentMode.CHEQUE:
          cheque = CurrencyUtil.add(cheque, amt);
          break;
        default:
          other = CurrencyUtil.add(other, amt);
          break;
      }
    });

    const totalCollected = CurrencyUtil.add(cash, upi, bank, cheque, other);
    const openingCash = closing ? parseFloat(closing.openingCash as any) : 0;
    const expectedClosing = CurrencyUtil.add(openingCash, cash);

    if (!closing && actorId) {
      closing = this.closingRepo.create({
        closingDate: dateStr,
        openedBy: actorId,
        openingCash,
        cashCollected: cash,
        upiCollected: upi,
        bankCollected: bank,
        chequeCollected: cheque,
        otherCollected: other,
        refunds: 0,
        expectedClosing,
        actualClosing: 0,
        difference: 0,
        status: DailyClosingStatus.OPEN,
      });
      closing = await this.closingRepo.save(closing);
    } else if (closing && closing.status === DailyClosingStatus.OPEN) {
      closing.cashCollected = cash;
      closing.upiCollected = upi;
      closing.bankCollected = bank;
      closing.chequeCollected = cheque;
      closing.otherCollected = other;
      closing.expectedClosing = expectedClosing;
      closing = await this.closingRepo.save(closing);
    }

    return {
      closing,
      date: dateStr,
      metrics: {
        openingCash,
        cashCollected: cash,
        upiCollected: upi,
        bankCollected: bank,
        chequeCollected: cheque,
        otherCollected: other,
        totalCollected,
        expectedClosingCash: expectedClosing,
        actualClosingCash: closing ? parseFloat(closing.actualClosing as any) : 0,
        difference: closing ? parseFloat(closing.difference as any) : 0,
        status: closing ? closing.status : DailyClosingStatus.OPEN,
      },
      payments,
    };
  }

  async reconcileClosing(dateStr: string, dto: ReconcileDailyClosingDto, actorId: string) {
    const summary = await this.getClosingForDate(dateStr, actorId);
    let closing = summary.closing;

    if (!closing) {
      throw new NotFoundException(`No closing found for date ${dateStr}`);
    }

    const actual = CurrencyUtil.round(dto.actualClosing);
    const expected = parseFloat(closing.expectedClosing as any);
    const difference = CurrencyUtil.subtract(actual, expected);

    closing.actualClosing = actual;
    closing.difference = difference;
    closing.notes = dto.notes || null;
    closing.closedBy = actorId;
    closing.closedAt = new Date();
    closing.status = DailyClosingStatus.CLOSED;

    const saved = await this.closingRepo.save(closing);

    await this.auditService.log({
      actorId,
      action: AuditAction.DAILY_CLOSING,
      entityName: 'DailyClosing',
      entityId: saved.id,
      afterState: saved,
      reason: `Reconciled daily closing for ${dateStr}. Expected Cash: ₹${expected}, Actual: ₹${actual}, Difference: ₹${difference}`,
    });

    return this.getClosingForDate(dateStr);
  }
}
