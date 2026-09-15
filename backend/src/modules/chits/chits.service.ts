import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Chit } from '../../entities/chit.entity';
import { ChitMonth } from '../../entities/chit-month.entity';
import { ChitMembership } from '../../entities/chit-membership.entity';
import { MonthlyDue } from '../../entities/monthly-due.entity';
import { Payment } from '../../entities/payment.entity';
import { CreateChitDto, UpdateChitDto } from './dto/create-chit.dto';
import { AuditService } from '../audit/audit.service';
import { AuditAction, ChitMonthStatus, ChitStatus, DueStatus } from '../../common/enums';
import { CurrencyUtil } from '../../common/utils/currency.util';

@Injectable()
export class ChitsService {
  constructor(
    @InjectRepository(Chit)
    private chitRepo: Repository<Chit>,
    @InjectRepository(ChitMonth)
    private monthRepo: Repository<ChitMonth>,
    @InjectRepository(ChitMembership)
    private membershipRepo: Repository<ChitMembership>,
    @InjectRepository(MonthlyDue)
    private dueRepo: Repository<MonthlyDue>,
    @InjectRepository(Payment)
    private paymentRepo: Repository<Payment>,
    private dataSource: DataSource,
    private auditService: AuditService,
  ) {}

  async findAll() {
    const chits = await this.chitRepo.find({
      relations: ['memberships', 'months'],
      order: { createdAt: 'DESC' },
    });

    const result = await Promise.all(chits.map((c) => this.getChitCardSummary(c)));
    return result;
  }

  async findOne(id: string) {
    const chit = await this.chitRepo.findOne({
      where: { id },
      relations: ['memberships', 'memberships.member', 'months'],
    });

    if (!chit) {
      throw new NotFoundException(`Chit with ID ${id} not found`);
    }

    return chit;
  }

  async getChitCardSummary(chit: Chit) {
    const memberships = await this.membershipRepo.find({
      where: { chitId: chit.id },
      relations: ['dues', 'dues.chitMonth'],
    });

    let totalExpected = 0;
    let totalCollected = 0;
    let totalPending = 0;
    let totalOverdue = 0;
    let totalInterest = 0;

    for (const ms of memberships) {
      for (const due of ms.dues || []) {
        const total = parseFloat(due.totalDue as any) || 0;
        const paid = parseFloat(due.totalPaid as any) || 0;
        const bal = parseFloat(due.balanceDue as any) || 0;
        const int = parseFloat(due.interestAmount as any) || 0;

        totalExpected = CurrencyUtil.add(totalExpected, total);
        totalCollected = CurrencyUtil.add(totalCollected, paid);
        totalPending = CurrencyUtil.add(totalPending, bal);
        totalInterest = CurrencyUtil.add(totalInterest, int);

        if (due.status === DueStatus.OVERDUE) {
          totalOverdue = CurrencyUtil.add(totalOverdue, bal);
        }
      }
    }

    // Determine current month sequence based on today
    const now = new Date();
    const currentCalMonth = now.getMonth() + 1;
    const currentCalYear = now.getFullYear();

    const currentMonth = chit.months?.find(
      (m) => m.calendarMonth === currentCalMonth && m.calendarYear === currentCalYear,
    );

    return {
      id: chit.id,
      chitCode: chit.chitCode,
      chitName: chit.chitName,
      totalValue: chit.totalValue,
      capacity: chit.capacity,
      enrolledMembers: memberships.length,
      durationMonths: chit.durationMonths,
      startMonth: chit.startMonth,
      startYear: chit.startYear,
      endMonth: chit.endMonth,
      endYear: chit.endYear,
      defaultInstallment: chit.defaultInstallment,
      dueDay: chit.dueDay,
      gracePeriodDays: chit.gracePeriodDays,
      defaultInterestRate: chit.defaultInterestRate,
      lateFee: chit.lateFee,
      status: chit.status,
      currentMonthSequence: currentMonth ? currentMonth.monthSequence : 1,
      totalExpected,
      totalCollected,
      totalPending,
      totalOverdue,
      totalInterest,
    };
  }

  async getChit360(id: string) {
    const chit = await this.findOne(id);
    const summary = await this.getChitCardSummary(chit);

    const memberships = await this.membershipRepo.find({
      where: { chitId: id },
      relations: ['member', 'dues', 'dues.chitMonth', 'liftEvents'],
      order: { seatNumber: 'ASC' },
    });

    const months = await this.monthRepo.find({
      where: { chitId: id },
      order: { monthSequence: 'ASC' },
    });

    // Compute member-wise ledger status for this chit
    const memberRows = memberships.map((ms) => {
      let paid = 0;
      let pending = 0;
      let interest = 0;
      let overdue = 0;
      let nextDue: MonthlyDue | null = null;

      const sortedDues = (ms.dues || []).sort((a, b) => (a.chitMonth?.monthSequence || 0) - (b.chitMonth?.monthSequence || 0));

      for (const due of sortedDues) {
        paid = CurrencyUtil.add(paid, parseFloat(due.totalPaid as any) || 0);
        pending = CurrencyUtil.add(pending, parseFloat(due.balanceDue as any) || 0);
        interest = CurrencyUtil.add(interest, parseFloat(due.interestAmount as any) || 0);

        if (due.status === DueStatus.OVERDUE) {
          overdue = CurrencyUtil.add(overdue, parseFloat(due.balanceDue as any) || 0);
        }

        if (!nextDue && (due.status === DueStatus.PENDING || due.status === DueStatus.PART_PAID || due.status === DueStatus.OVERDUE)) {
          nextDue = due;
        }
      }

      const isLifted = ms.status === 'LIFTED' || (ms.liftEvents && ms.liftEvents.length > 0);
      const liftEvent = ms.liftEvents?.[0] || null;

      return {
        membershipId: ms.id,
        seatNumber: ms.seatNumber,
        memberId: ms.member?.id,
        memberCode: ms.member?.memberCode,
        fullName: ms.member?.fullName,
        phone: ms.member?.phone,
        status: ms.status,
        monthlyInstallment: ms.customInstallment || chit.defaultInstallment,
        totalPaid: paid,
        totalPending: pending,
        totalInterest: interest,
        totalOverdue: overdue,
        isLifted,
        liftDetails: liftEvent,
        nextDueMonth: nextDue ? nextDue.chitMonth?.monthSequence : null,
        nextDueDate: nextDue ? nextDue.chitMonth?.dueDate : null,
        nextDueAmount: nextDue ? parseFloat(nextDue.balanceDue as any) : 0,
        dues: sortedDues,
      };
    });

    // Compute monthly collection matrix
    const monthlyMatrix = months.map((m) => {
      let monthExpected = 0;
      let monthCollected = 0;
      let monthPending = 0;

      memberships.forEach((ms) => {
        const due = ms.dues?.find((d) => d.chitMonthId === m.id);
        if (due) {
          monthExpected = CurrencyUtil.add(monthExpected, parseFloat(due.totalDue as any) || 0);
          monthCollected = CurrencyUtil.add(monthCollected, parseFloat(due.totalPaid as any) || 0);
          monthPending = CurrencyUtil.add(monthPending, parseFloat(due.balanceDue as any) || 0);
        }
      });

      return {
        id: m.id,
        monthSequence: m.monthSequence,
        calendarMonth: m.calendarMonth,
        calendarYear: m.calendarYear,
        dueDate: m.dueDate,
        graceDate: m.graceDate,
        status: m.status,
        dividendPerMember: m.dividendPerMember,
        expected: monthExpected,
        collected: monthCollected,
        pending: monthPending,
      };
    });

    return {
      chit,
      summary,
      members: memberRows,
      months: monthlyMatrix,
    };
  }

  async create(dto: CreateChitDto, actorId?: string) {
    const existing = await this.chitRepo.findOne({
      where: { chitCode: dto.chitCode.toUpperCase().trim() },
    });

    if (existing) {
      throw new ConflictException(`Chit code ${dto.chitCode} already exists`);
    }

    // Calculate duration in months
    const startTotalMonths = dto.startYear * 12 + dto.startMonth;
    const endTotalMonths = dto.endYear * 12 + dto.endMonth;

    if (endTotalMonths < startTotalMonths) {
      throw new BadRequestException('End month/year must be equal to or after start month/year');
    }

    const durationMonths = endTotalMonths - startTotalMonths + 1;
    const defaultInstallment = dto.defaultInstallment || CurrencyUtil.round(dto.totalValue / durationMonths);
    const dueDay = dto.dueDay || 10;
    const gracePeriod = dto.gracePeriodDays || 5;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const chit = queryRunner.manager.create(Chit, {
        ...dto,
        chitCode: dto.chitCode.toUpperCase().trim(),
        durationMonths,
        defaultInstallment,
        dueDay,
        gracePeriodDays: gracePeriod,
        defaultInterestRate: dto.defaultInterestRate || 2.0,
        lateFee: dto.lateFee || 0,
        status: dto.status || ChitStatus.ACTIVE,
      });

      const savedChit = await queryRunner.manager.save(chit);

      // Generate ChitMonth records
      const chitMonths: ChitMonth[] = [];
      let currentM = dto.startMonth;
      let currentY = dto.startYear;

      for (let seq = 1; seq <= durationMonths; seq++) {
        const dueDateStr = `${currentY}-${String(currentM).padStart(2, '0')}-${String(dueDay).padStart(2, '0')}`;
        const graceDayNum = Math.min(28, dueDay + gracePeriod);
        const graceDateStr = `${currentY}-${String(currentM).padStart(2, '0')}-${String(graceDayNum).padStart(2, '0')}`;

        const chitMonth = queryRunner.manager.create(ChitMonth, {
          chitId: savedChit.id,
          monthSequence: seq,
          calendarMonth: currentM,
          calendarYear: currentY,
          dueDate: dueDateStr,
          graceDate: graceDateStr,
          interestRateOverride: null,
          status: seq === 1 ? ChitMonthStatus.OPEN : ChitMonthStatus.PENDING,
        });

        chitMonths.push(chitMonth);

        currentM++;
        if (currentM > 12) {
          currentM = 1;
          currentY++;
        }
      }

      await queryRunner.manager.save(ChitMonth, chitMonths);
      await queryRunner.commitTransaction();

      await this.auditService.log({
        actorId,
        action: AuditAction.CREATE,
        entityName: 'Chit',
        entityId: savedChit.id,
        afterState: savedChit,
        reason: `Created chit ${savedChit.chitName} (${savedChit.chitCode}) with ${durationMonths} months`,
      });

      return this.findOne(savedChit.id);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async update(id: string, dto: UpdateChitDto, actorId?: string) {
    const chit = await this.findOne(id);
    const beforeState = { ...chit };

    Object.assign(chit, dto);
    const updated = await this.chitRepo.save(chit);

    await this.auditService.log({
      actorId,
      action: AuditAction.UPDATE,
      entityName: 'Chit',
      entityId: updated.id,
      beforeState,
      afterState: updated,
      reason: `Updated chit parameters for ${updated.chitCode}`,
    });

    return updated;
  }
}
