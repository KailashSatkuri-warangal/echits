import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { MonthlyDue } from '../../entities/monthly-due.entity';
import { ChitMembership } from '../../entities/chit-membership.entity';
import { ChitMonth } from '../../entities/chit-month.entity';
import { Chit } from '../../entities/chit.entity';
import { Adjustment } from '../../entities/adjustment.entity';
import { PaymentAllocation } from '../../entities/payment-allocation.entity';
import { CreateAdjustmentDto } from './dto/create-adjustment.dto';
import { AuditService } from '../audit/audit.service';
import { AuditAction, DueStatus } from '../../common/enums';
import { CurrencyUtil } from '../../common/utils/currency.util';

@Injectable()
export class LedgerService {
  constructor(
    @InjectRepository(MonthlyDue)
    private dueRepo: Repository<MonthlyDue>,
    @InjectRepository(ChitMembership)
    private membershipRepo: Repository<ChitMembership>,
    @InjectRepository(ChitMonth)
    private monthRepo: Repository<ChitMonth>,
    @InjectRepository(Adjustment)
    private adjustmentRepo: Repository<Adjustment>,
    @InjectRepository(PaymentAllocation)
    private allocRepo: Repository<PaymentAllocation>,
    private dataSource: DataSource,
    private auditService: AuditService,
  ) {}

  async getMembershipLedger(membershipId: string) {
    const membership = await this.membershipRepo.findOne({
      where: { id: membershipId },
      relations: ['member', 'chit'],
    });

    if (!membership) {
      throw new NotFoundException(`Membership ${membershipId} not found`);
    }

    const dues = await this.dueRepo.find({
      where: { membershipId },
      relations: ['chitMonth', 'allocations', 'allocations.payment', 'adjustments'],
      order: { chitMonth: { monthSequence: 'ASC' } },
    });

    return {
      membership,
      dues,
    };
  }

  async getDueCalculation(dueId: string) {
    const due = await this.dueRepo.findOne({
      where: { id: dueId },
      relations: ['membership', 'membership.member', 'membership.chit', 'chitMonth', 'allocations', 'adjustments'],
    });

    if (!due) {
      throw new NotFoundException(`Due ${dueId} not found`);
    }

    return {
      dueId: due.id,
      member: {
        id: due.membership?.member?.id,
        fullName: due.membership?.member?.fullName,
        memberCode: due.membership?.member?.memberCode,
        phone: due.membership?.member?.phone,
      },
      chit: {
        id: due.membership?.chit?.id,
        chitCode: due.membership?.chit?.chitCode,
        chitName: due.membership?.chit?.chitName,
        seatNumber: due.membership?.seatNumber,
      },
      chitMonth: {
        id: due.chitMonth?.id,
        monthSequence: due.chitMonth?.monthSequence,
        calendarMonth: due.chitMonth?.calendarMonth,
        calendarYear: due.chitMonth?.calendarYear,
        dueDate: due.chitMonth?.dueDate,
        graceDate: due.chitMonth?.graceDate,
      },
      calculation: {
        scheduledDue: parseFloat(due.scheduledDue as any) || 0,
        previousBalance: parseFloat(due.previousBalance as any) || 0,
        interestBase: parseFloat(due.interestBase as any) || 0,
        interestRate: parseFloat(due.interestRate as any) || 0,
        interestAmount: parseFloat(due.interestAmount as any) || 0,
        lateFee: parseFloat(due.lateFee as any) || 0,
        adjustmentAmount: parseFloat(due.adjustmentAmount as any) || 0,
        totalDue: parseFloat(due.totalDue as any) || 0,
        totalPaid: parseFloat(due.totalPaid as any) || 0,
        balanceDue: parseFloat(due.balanceDue as any) || 0,
        status: due.status,
      },
    };
  }

  /**
   * Recalculates the entire sequential financial ledger for a chit membership.
   * Enforces authoritative interest hierarchy, previous balance roll-forward, and status state machine.
   */
  async recalculateMembershipLedger(membershipId: string, manager?: any): Promise<MonthlyDue[]> {
    const repo = manager ? manager.getRepository(MonthlyDue) : this.dueRepo;
    const msRepo = manager ? manager.getRepository(ChitMembership) : this.membershipRepo;

    const membership = await msRepo.findOne({
      where: { id: membershipId },
      relations: ['chit'],
    });

    if (!membership) {
      throw new NotFoundException(`Membership with ID ${membershipId} not found`);
    }

    const dues = await repo.find({
      where: { membershipId },
      relations: ['chitMonth', 'allocations', 'adjustments'],
      order: { chitMonth: { monthSequence: 'ASC' } },
    });

    let previousCarriedBalance = parseFloat(membership.openingBalance as any) || 0;
    const nowStr = new Date().toISOString().slice(0, 10);
    const updatedDues: MonthlyDue[] = [];

    for (let i = 0; i < dues.length; i++) {
      const due = dues[i];
      const chitMonth = due.chitMonth;
      const scheduledDue = parseFloat(due.scheduledDue as any) || parseFloat(membership.customInstallment as any) || parseFloat(membership.chit?.defaultInstallment as any) || 0;

      // 1. Set Previous Balance
      due.previousBalance = CurrencyUtil.round(previousCarriedBalance);

      // 2. Determine Interest Rate Hierarchy: ChitMonth override -> Chit default -> 2% default
      let effectiveRate = 2.0;
      if (chitMonth?.interestRateOverride != null) {
        effectiveRate = parseFloat(chitMonth.interestRateOverride as any);
      } else if (membership.chit?.defaultInterestRate != null) {
        effectiveRate = parseFloat(membership.chit.defaultInterestRate as any);
      }
      due.interestRate = CurrencyUtil.round(effectiveRate);

      // 3. Interest Base is positive delinquent previous balance
      due.interestBase = CurrencyUtil.round(Math.max(0, due.previousBalance));

      // 4. Calculate Interest Amount (No silent compounding)
      due.interestAmount = CurrencyUtil.round((due.interestBase * due.interestRate) / 100);

      // 5. Late Fee evaluation: applied if past grace date and has unpaid balance
      let lateFee = 0;
      if (chitMonth?.graceDate && nowStr > chitMonth.graceDate) {
        lateFee = parseFloat(membership.chit?.lateFee as any) || 0;
      }
      due.lateFee = CurrencyUtil.round(lateFee);

      // 6. Total Adjustments
      const totalAdj = (due.adjustments || []).reduce(
        (sum, a) => CurrencyUtil.add(sum, parseFloat(a.amount as any) || 0),
        0,
      );
      due.adjustmentAmount = CurrencyUtil.round(totalAdj);

      // 7. Calculate Total Due
      due.totalDue = CurrencyUtil.round(
        CurrencyUtil.add(due.previousBalance, scheduledDue, due.interestAmount, due.lateFee) - due.adjustmentAmount,
      );
      if (due.totalDue < 0) due.totalDue = 0;

      // 8. Total Paid from allocations
      const totalAllocated = (due.allocations || []).reduce(
        (sum, a) => CurrencyUtil.add(sum, parseFloat(a.totalAllocated as any) || 0),
        0,
      );
      due.totalPaid = CurrencyUtil.round(totalAllocated);

      // 9. Remaining Balance
      due.balanceDue = CurrencyUtil.round(Math.max(0, due.totalDue - due.totalPaid));

      // 10. Status State Machine
      if (due.totalPaid >= due.totalDue && due.totalDue > 0) {
        due.status = DueStatus.PAID;
      } else if (due.totalPaid > 0 && due.totalPaid < due.totalDue) {
        due.status = DueStatus.PART_PAID;
      } else if (due.totalDue === 0 && due.adjustmentAmount > 0) {
        due.status = DueStatus.WAIVED;
      } else if (chitMonth?.graceDate && nowStr > chitMonth.graceDate) {
        due.status = DueStatus.OVERDUE;
      } else {
        due.status = DueStatus.PENDING;
      }

      // Roll forward balance to next month
      previousCarriedBalance = due.balanceDue;

      const saved = await repo.save(due);
      updatedDues.push(saved);
    }

    return updatedDues;
  }

  async addAdjustment(dto: CreateAdjustmentDto, actorId: string) {
    const due = await this.dueRepo.findOne({
      where: { id: dto.monthlyDueId },
      relations: ['membership'],
    });

    if (!due) {
      throw new NotFoundException(`Monthly due ${dto.monthlyDueId} not found`);
    }

    const adjustment = this.adjustmentRepo.create({
      monthlyDueId: dto.monthlyDueId,
      adjustmentType: dto.adjustmentType,
      amount: CurrencyUtil.round(dto.amount),
      reason: dto.reason,
      authorizedBy: actorId,
    });

    const savedAdj = await this.adjustmentRepo.save(adjustment);

    // Recalculate ledger for the membership
    await this.recalculateMembershipLedger(due.membershipId);

    await this.auditService.log({
      actorId,
      action: AuditAction.ADJUSTMENT_APPROVED,
      entityName: 'Adjustment',
      entityId: savedAdj.id,
      afterState: savedAdj,
      reason: `Approved adjustment of ₹${savedAdj.amount} (${savedAdj.adjustmentType}) for due ${due.id}: ${savedAdj.reason}`,
    });

    return savedAdj;
  }
}
