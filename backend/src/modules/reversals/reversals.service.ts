import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Payment } from '../../entities/payment.entity';
import { PaymentReversal } from '../../entities/payment-reversal.entity';
import { PaymentAllocation } from '../../entities/payment-allocation.entity';
import { MonthlyDue } from '../../entities/monthly-due.entity';
import { MemberAdvance } from '../../entities/member-advance.entity';
import { ReversePaymentDto } from './dto/reverse-payment.dto';
import { LedgerService } from '../ledger/ledger.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../../common/enums';
import { CurrencyUtil } from '../../common/utils/currency.util';

@Injectable()
export class ReversalsService {
  constructor(
    @InjectRepository(Payment)
    private paymentRepo: Repository<Payment>,
    @InjectRepository(PaymentReversal)
    private reversalRepo: Repository<PaymentReversal>,
    @InjectRepository(PaymentAllocation)
    private allocRepo: Repository<PaymentAllocation>,
    @InjectRepository(MonthlyDue)
    private dueRepo: Repository<MonthlyDue>,
    @InjectRepository(MemberAdvance)
    private advanceRepo: Repository<MemberAdvance>,
    private ledgerService: LedgerService,
    private dataSource: DataSource,
    private auditService: AuditService,
  ) {}

  async reversePayment(dto: ReversePaymentDto, actorId: string) {
    const payment = await this.paymentRepo.findOne({
      where: { id: dto.paymentId },
      relations: ['allocations', 'allocations.monthlyDue', 'member'],
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${dto.paymentId} not found`);
    }

    if (payment.isReversed) {
      throw new ConflictException(`Payment ${payment.receiptNumber} is already reversed`);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const affectedMembershipIds = new Set<string>();
      const allocationsSummary = (payment.allocations || []).map((a) => {
        if (a.monthlyDue?.membershipId) {
          affectedMembershipIds.add(a.monthlyDue.membershipId);
        }
        return {
          allocationId: a.id,
          monthlyDueId: a.monthlyDueId,
          interestAllocated: a.interestAllocated,
          feeAllocated: a.feeAllocated,
          principalAllocated: a.principalAllocated,
          totalAllocated: a.totalAllocated,
        };
      });

      // 1. Create linked reversal record
      const reversal = queryRunner.manager.create(PaymentReversal, {
        paymentId: payment.id,
        reason: dto.reason,
        reversedBy: actorId,
        reversedAt: new Date(),
        restoredAllocationsJson: JSON.stringify(allocationsSummary),
      });

      const savedReversal = await queryRunner.manager.save(reversal);

      // 2. Unwind allocations: remove allocations
      if (payment.allocations && payment.allocations.length > 0) {
        await queryRunner.manager.remove(payment.allocations);
      }

      // 3. Unwind advance credit if advance was created
      const advanceAmount = parseFloat(payment.advanceAmount as any) || 0;
      if (advanceAmount > 0) {
        const advance = await queryRunner.manager.findOne(MemberAdvance, {
          where: { memberId: payment.memberId, chitId: payment.chitId || null },
        });
        if (advance) {
          advance.creditBalance = Math.max(0, CurrencyUtil.subtract(advance.creditBalance, advanceAmount));
          await queryRunner.manager.save(advance);
        }
      }

      // 4. Mark payment as reversed
      payment.isReversed = true;
      payment.allocatedAmount = 0;
      payment.advanceAmount = 0;
      await queryRunner.manager.save(payment);

      // 5. Recalculate financial ledgers for all affected memberships
      for (const membershipId of affectedMembershipIds) {
        await this.ledgerService.recalculateMembershipLedger(membershipId, queryRunner.manager);
      }

      await queryRunner.commitTransaction();

      await this.auditService.log({
        actorId,
        action: AuditAction.PAYMENT_REVERSED,
        entityName: 'Payment',
        entityId: payment.id,
        afterState: {
          receiptNumber: payment.receiptNumber,
          isReversed: true,
          reason: dto.reason,
        },
        reason: `Reversed payment ${payment.receiptNumber} of ₹${payment.totalAmount}: ${dto.reason}`,
      });

      return {
        success: true,
        reversal: savedReversal,
        payment: await this.paymentRepo.findOne({
          where: { id: payment.id },
          relations: ['reversal', 'member', 'chit'],
        }),
      };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
