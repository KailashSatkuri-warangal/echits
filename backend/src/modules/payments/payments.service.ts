import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { Payment } from '../../entities/payment.entity';
import { PaymentAllocation } from '../../entities/payment-allocation.entity';
import { MonthlyDue } from '../../entities/monthly-due.entity';
import { Member } from '../../entities/member.entity';
import { Chit } from '../../entities/chit.entity';
import { ChitMembership } from '../../entities/chit-membership.entity';
import { MemberAdvance } from '../../entities/member-advance.entity';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { LedgerService } from '../ledger/ledger.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction, DueStatus, PaymentMode } from '../../common/enums';
import { CurrencyUtil } from '../../common/utils/currency.util';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private paymentRepo: Repository<Payment>,
    @InjectRepository(PaymentAllocation)
    private allocRepo: Repository<PaymentAllocation>,
    @InjectRepository(MonthlyDue)
    private dueRepo: Repository<MonthlyDue>,
    @InjectRepository(Member)
    private memberRepo: Repository<Member>,
    @InjectRepository(Chit)
    private chitRepo: Repository<Chit>,
    @InjectRepository(ChitMembership)
    private membershipRepo: Repository<ChitMembership>,
    @InjectRepository(MemberAdvance)
    private advanceRepo: Repository<MemberAdvance>,
    private ledgerService: LedgerService,
    private dataSource: DataSource,
    private auditService: AuditService,
  ) {}

  async findAll(query?: { memberId?: string; chitId?: string; paymentMode?: PaymentMode; page?: number; limit?: number }) {
    const page = query?.page || 1;
    const limit = query?.limit || 20;

    const qb = this.paymentRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.member', 'member')
      .leftJoinAndSelect('p.chit', 'chit')
      .leftJoinAndSelect('p.collectedByUser', 'collectedByUser')
      .leftJoinAndSelect('p.allocations', 'allocations')
      .leftJoinAndSelect('allocations.monthlyDue', 'monthlyDue')
      .leftJoinAndSelect('monthlyDue.chitMonth', 'chitMonth')
      .leftJoinAndSelect('p.reversal', 'reversal')
      .orderBy('p.collectedAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (query?.memberId) {
      qb.andWhere('p.memberId = :memberId', { memberId: query.memberId });
    }
    if (query?.chitId) {
      qb.andWhere('p.chitId = :chitId', { chitId: query.chitId });
    }
    if (query?.paymentMode) {
      qb.andWhere('p.paymentMode = :paymentMode', { paymentMode: query.paymentMode });
    }

    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const payment = await this.paymentRepo.findOne({
      where: { id },
      relations: [
        'member',
        'chit',
        'collectedByUser',
        'allocations',
        'allocations.monthlyDue',
        'allocations.monthlyDue.chitMonth',
        'reversal',
        'reversal.reversedByUser',
      ],
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    return payment;
  }

  async getReceiptData(id: string) {
    const payment = await this.findOne(id);
    const allocations = payment.allocations || [];

    // Calculate total previous balance, current dues, interest, fees settled
    let totalInterestAllocated = 0;
    let totalFeeAllocated = 0;
    let totalPrincipalAllocated = 0;

    allocations.forEach((a) => {
      totalInterestAllocated = CurrencyUtil.add(totalInterestAllocated, parseFloat(a.interestAllocated as any) || 0);
      totalFeeAllocated = CurrencyUtil.add(totalFeeAllocated, parseFloat(a.feeAllocated as any) || 0);
      totalPrincipalAllocated = CurrencyUtil.add(totalPrincipalAllocated, parseFloat(a.principalAllocated as any) || 0);
    });

    // Check remaining balance for member in this chit
    let remainingChitBalance = 0;
    if (payment.chitId) {
      const ms = await this.membershipRepo.findOne({
        where: { memberId: payment.memberId, chitId: payment.chitId },
        relations: ['dues'],
      });
      if (ms && ms.dues) {
        remainingChitBalance = ms.dues.reduce(
          (sum, d) => CurrencyUtil.add(sum, parseFloat(d.balanceDue as any) || 0),
          0,
        );
      }
    }

    return {
      payment,
      receiptNumber: payment.receiptNumber,
      date: payment.collectedAt,
      amount: parseFloat(payment.totalAmount as any),
      allocatedAmount: parseFloat(payment.allocatedAmount as any),
      advanceAmount: parseFloat(payment.advanceAmount as any),
      paymentMode: payment.paymentMode,
      referenceNumber: payment.referenceNumber,
      member: {
        id: payment.member?.id,
        name: payment.member?.fullName,
        code: payment.member?.memberCode,
        phone: payment.member?.phone,
        address: payment.member?.address,
      },
      chit: payment.chit
        ? {
            id: payment.chit.id,
            code: payment.chit.chitCode,
            name: payment.chit.chitName,
            totalValue: payment.chit.totalValue,
          }
        : null,
      collectedBy: {
        id: payment.collectedByUser?.id,
        name: payment.collectedByUser?.name,
        role: payment.collectedByUser?.role,
      },
      allocationBreakdown: allocations.map((a) => ({
        dueId: a.monthlyDueId,
        monthSequence: a.monthlyDue?.chitMonth?.monthSequence,
        calendarMonth: a.monthlyDue?.chitMonth?.calendarMonth,
        calendarYear: a.monthlyDue?.chitMonth?.calendarYear,
        interestPaid: parseFloat(a.interestAllocated as any) || 0,
        feePaid: parseFloat(a.feeAllocated as any) || 0,
        principalPaid: parseFloat(a.principalAllocated as any) || 0,
        totalAllocated: parseFloat(a.totalAllocated as any) || 0,
        dueBalanceRemaining: parseFloat(a.monthlyDue?.balanceDue as any) || 0,
        dueStatus: a.monthlyDue?.status,
      })),
      totalInterestAllocated,
      totalFeeAllocated,
      totalPrincipalAllocated,
      remainingChitBalance,
      isReversed: payment.isReversed,
      reversal: payment.reversal,
    };
  }

  /**
   * Authoritative payment processing with deterministic allocation & idempotency
   */
  async recordPayment(dto: RecordPaymentDto, collectorId: string) {
    // 1. Check Idempotency Key
    const existing = await this.paymentRepo.findOne({
      where: { idempotencyKey: dto.idempotencyKey },
    });
    if (existing) {
      // Idempotent retry: Return already recorded transaction receipt
      return this.getReceiptData(existing.id);
    }

    const member = await this.memberRepo.findOne({ where: { id: dto.memberId } });
    if (!member) {
      throw new NotFoundException(`Member with ID ${dto.memberId} not found`);
    }

    const paymentAmount = CurrencyUtil.round(dto.amount);
    if (paymentAmount <= 0) {
      throw new BadRequestException('Payment amount must be greater than zero');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 2. Generate Receipt Number
      const now = new Date();
      const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
      const countToday = await queryRunner.manager.count(Payment);
      const receiptNumber = `REC-${yearMonth}-${String(countToday + 1).padStart(4, '0')}`;

      // 3. Find dues to allocate payment
      let targetDues: MonthlyDue[] = [];

      if (dto.monthlyDueId) {
        // Specific due selected
        const primaryDue = await queryRunner.manager.findOne(MonthlyDue, {
          where: { id: dto.monthlyDueId },
          relations: ['chitMonth', 'membership'],
        });
        if (primaryDue) {
          // Also fetch subsequent dues for the same membership if payment exceeds primary due
          const msDues = await queryRunner.manager.find(MonthlyDue, {
            where: { membershipId: primaryDue.membershipId },
            relations: ['chitMonth', 'membership'],
            order: { chitMonth: { monthSequence: 'ASC' } },
          });
          // Put primary due first, then any other unpaid dues
          targetDues = [primaryDue, ...msDues.filter((d) => d.id !== primaryDue.id && d.status !== DueStatus.PAID)];
        }
      } else if (dto.chitId) {
        // Specific Chit selected: Get all unpaid dues for this member in this chit
        const ms = await queryRunner.manager.findOne(ChitMembership, {
          where: { memberId: dto.memberId, chitId: dto.chitId },
        });
        if (ms) {
          targetDues = await queryRunner.manager.find(MonthlyDue, {
            where: { membershipId: ms.id },
            relations: ['chitMonth', 'membership'],
            order: { chitMonth: { monthSequence: 'ASC' } },
          });
        }
      } else {
        // Multi-chit batch: Get all unpaid dues across all memberships of the member
        const memberships = await queryRunner.manager.find(ChitMembership, {
          where: { memberId: dto.memberId, status: In(['ACTIVE', 'LIFTED']) },
        });
        const msIds = memberships.map((m) => m.id);
        if (msIds.length > 0) {
          targetDues = await queryRunner.manager.find(MonthlyDue, {
            where: { membershipId: In(msIds) },
            relations: ['chitMonth', 'membership'],
            order: { chitMonth: { monthSequence: 'ASC' } },
          });
        }
      }

      // Filter to only dues that still have an unpaid balance
      const unpaidDues = targetDues.filter((d) => (parseFloat(d.balanceDue as any) || 0) > 0);

      // 4. Perform deterministic allocation: Oldest dues first, Interest -> Fees -> Principal
      let unallocatedAmount = paymentAmount;
      const createdAllocations: PaymentAllocation[] = [];
      const affectedMembershipIds = new Set<string>();

      const payment = queryRunner.manager.create(Payment, {
        receiptNumber,
        memberId: dto.memberId,
        chitId: dto.chitId || (targetDues[0]?.membership ? (targetDues[0].membership as any).chitId : null),
        totalAmount: paymentAmount,
        allocatedAmount: 0,
        advanceAmount: 0,
        paymentMode: dto.paymentMode,
        referenceNumber: dto.referenceNumber || null,
        notes: dto.notes || null,
        collectedBy: collectorId,
        collectedAt: now,
        idempotencyKey: dto.idempotencyKey,
        isReversed: false,
      });

      const savedPayment = await queryRunner.manager.save(payment);

      for (const due of unpaidDues) {
        if (unallocatedAmount <= 0) break;

        const dueBal = parseFloat(due.balanceDue as any) || 0;
        const dueInterest = parseFloat(due.interestAmount as any) || 0;
        const dueLateFee = parseFloat(due.lateFee as any) || 0;

        // Allocation components
        let interestPortion = 0;
        let feePortion = 0;
        let principalPortion = 0;

        // Priority 1: Interest
        if (dueInterest > 0 && unallocatedAmount > 0) {
          interestPortion = Math.min(unallocatedAmount, dueInterest);
          unallocatedAmount = CurrencyUtil.subtract(unallocatedAmount, interestPortion);
        }

        // Priority 2: Late Fees
        if (dueLateFee > 0 && unallocatedAmount > 0) {
          feePortion = Math.min(unallocatedAmount, dueLateFee);
          unallocatedAmount = CurrencyUtil.subtract(unallocatedAmount, feePortion);
        }

        // Priority 3: Principal
        const remainingDueForPrincipal = Math.max(0, dueBal - interestPortion - feePortion);
        if (remainingDueForPrincipal > 0 && unallocatedAmount > 0) {
          principalPortion = Math.min(unallocatedAmount, remainingDueForPrincipal);
          unallocatedAmount = CurrencyUtil.subtract(unallocatedAmount, principalPortion);
        }

        const totalAllocToDue = CurrencyUtil.add(interestPortion, feePortion, principalPortion);

        if (totalAllocToDue > 0) {
          const allocation = queryRunner.manager.create(PaymentAllocation, {
            paymentId: savedPayment.id,
            monthlyDueId: due.id,
            interestAllocated: interestPortion,
            feeAllocated: feePortion,
            principalAllocated: principalPortion,
            totalAllocated: totalAllocToDue,
          });

          const savedAlloc = await queryRunner.manager.save(allocation);
          createdAllocations.push(savedAlloc);

          affectedMembershipIds.add(due.membershipId);
        }
      }

      // 5. Check for Excess / Advance payment
      const allocatedTotal = CurrencyUtil.subtract(paymentAmount, unallocatedAmount);
      savedPayment.allocatedAmount = allocatedTotal;
      savedPayment.advanceAmount = unallocatedAmount;
      await queryRunner.manager.save(savedPayment);

      if (unallocatedAmount > 0) {
        // Record credit advance for member
        let advance = await queryRunner.manager.findOne(MemberAdvance, {
          where: { memberId: dto.memberId, chitId: dto.chitId || null },
        });

        if (!advance) {
          advance = queryRunner.manager.create(MemberAdvance, {
            memberId: dto.memberId,
            chitId: dto.chitId || null,
            creditBalance: unallocatedAmount,
          });
        } else {
          advance.creditBalance = CurrencyUtil.add(advance.creditBalance, unallocatedAmount);
        }
        await queryRunner.manager.save(advance);
      }

      // 6. Recalculate financial ledgers for all affected memberships
      for (const membershipId of affectedMembershipIds) {
        await this.ledgerService.recalculateMembershipLedger(membershipId, queryRunner.manager);
      }

      await queryRunner.commitTransaction();

      await this.auditService.log({
        actorId: collectorId,
        action: AuditAction.PAYMENT_RECORDED,
        entityName: 'Payment',
        entityId: savedPayment.id,
        afterState: {
          receiptNumber: savedPayment.receiptNumber,
          amount: savedPayment.totalAmount,
          allocated: savedPayment.allocatedAmount,
          advance: savedPayment.advanceAmount,
          paymentMode: savedPayment.paymentMode,
        },
        reason: `Collected ₹${savedPayment.totalAmount} (${savedPayment.paymentMode}) from ${member.fullName}`,
      });

      return this.getReceiptData(savedPayment.id);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
