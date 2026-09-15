import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, MoreThanOrEqual } from 'typeorm';
import { LiftEvent } from '../../entities/lift-event.entity';
import { ChitMembership } from '../../entities/chit-membership.entity';
import { ChitMonth } from '../../entities/chit-month.entity';
import { Chit } from '../../entities/chit.entity';
import { MonthlyDue } from '../../entities/monthly-due.entity';
import { CreateLiftEventDto } from './dto/create-lift-event.dto';
import { LedgerService } from '../ledger/ledger.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction, LiftApprovalStatus, MembershipStatus } from '../../common/enums';
import { CurrencyUtil } from '../../common/utils/currency.util';

@Injectable()
export class LiftService {
  constructor(
    @InjectRepository(LiftEvent)
    private liftRepo: Repository<LiftEvent>,
    @InjectRepository(ChitMembership)
    private membershipRepo: Repository<ChitMembership>,
    @InjectRepository(ChitMonth)
    private monthRepo: Repository<ChitMonth>,
    @InjectRepository(MonthlyDue)
    private dueRepo: Repository<MonthlyDue>,
    private ledgerService: LedgerService,
    private dataSource: DataSource,
    private auditService: AuditService,
  ) {}

  async findAll(chitId?: string) {
    const qb = this.liftRepo
      .createQueryBuilder('l')
      .leftJoinAndSelect('l.membership', 'membership')
      .leftJoinAndSelect('membership.member', 'member')
      .leftJoinAndSelect('membership.chit', 'chit')
      .leftJoinAndSelect('l.chitMonth', 'chitMonth')
      .leftJoinAndSelect('l.approvedByUser', 'approvedByUser')
      .orderBy('l.liftDate', 'DESC');

    if (chitId) {
      qb.andWhere('membership.chitId = :chitId', { chitId });
    }

    return qb.getMany();
  }

  async findOne(id: string) {
    const lift = await this.liftRepo.findOne({
      where: { id },
      relations: ['membership', 'membership.member', 'membership.chit', 'chitMonth', 'approvedByUser'],
    });

    if (!lift) {
      throw new NotFoundException(`Lift event ${id} not found`);
    }

    return lift;
  }

  async create(dto: CreateLiftEventDto, actorId: string) {
    const membership = await this.membershipRepo.findOne({
      where: { id: dto.membershipId },
      relations: ['member', 'chit'],
    });

    if (!membership) {
      throw new NotFoundException(`Membership ${dto.membershipId} not found`);
    }

    const chitMonth = await this.monthRepo.findOne({
      where: { id: dto.chitMonthId },
    });

    if (!chitMonth) {
      throw new NotFoundException(`Chit month ${dto.chitMonthId} not found`);
    }

    // Check if membership is already lifted
    const existingLift = await this.liftRepo.findOne({
      where: { membershipId: dto.membershipId, approvalStatus: LiftApprovalStatus.APPROVED },
    });
    if (existingLift) {
      throw new ConflictException('This membership seat has already been lifted in an earlier auction');
    }

    const chitValue = parseFloat(membership.chit?.totalValue as any) || 0;
    const capacity = membership.chit?.capacity || 20;
    const bidDiscount = CurrencyUtil.round(dto.bidDiscount);
    const companyCommission = CurrencyUtil.round(dto.companyCommission ?? (chitValue * 0.05)); // 5% default
    const dividendAmount = Math.max(0, CurrencyUtil.subtract(bidDiscount, companyCommission));
    const dividendPerMember = CurrencyUtil.round(dividendAmount / capacity);
    const amountReleased = CurrencyUtil.round(chitValue - bidDiscount);
    const prevInstallment = parseFloat(membership.customInstallment as any) || parseFloat(membership.chit?.defaultInstallment as any) || 0;
    const newInstallment = CurrencyUtil.round(dto.newInstallment ?? membership.chit?.defaultInstallment ?? prevInstallment);
    const effectiveSeq = chitMonth.monthSequence;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Create Lift Event
      const lift = queryRunner.manager.create(LiftEvent, {
        membershipId: dto.membershipId,
        chitMonthId: dto.chitMonthId,
        liftDate: dto.liftDate,
        chitValue,
        bidDiscount,
        companyCommission,
        dividendAmount,
        dividendPerMember,
        amountReleased,
        previousInstallment: prevInstallment,
        newInstallment,
        effectiveMonthSequence: effectiveSeq,
        approvalStatus: LiftApprovalStatus.APPROVED,
        approvedBy: actorId,
        remarks: dto.remarks || null,
      });

      const savedLift = await queryRunner.manager.save(lift);

      // 2. Update ChitMonth dividend info
      chitMonth.dividendPerMember = dividendPerMember;
      chitMonth.auctionDate = dto.liftDate;
      await queryRunner.manager.save(chitMonth);

      // 3. Update Membership status to LIFTED
      membership.status = MembershipStatus.LIFTED;
      membership.customInstallment = newInstallment;
      await queryRunner.manager.save(membership);

      // 4. Update FUTURE scheduled dues for this member (from effectiveSeq onwards)
      // Historical dues (< effectiveSeq) remain 100% untouched!
      const memberFutureDues = await queryRunner.manager
        .createQueryBuilder(MonthlyDue, 'due')
        .innerJoin('due.chitMonth', 'cm')
        .where('due.membershipId = :membershipId', { membershipId: membership.id })
        .andWhere('cm.monthSequence >= :effectiveSeq', { effectiveSeq })
        .getMany();

      for (const due of memberFutureDues) {
        due.scheduledDue = newInstallment;
        await queryRunner.manager.save(due);
      }

      // Recalculate ledger for the winning member
      await this.ledgerService.recalculateMembershipLedger(membership.id, queryRunner.manager);

      // 5. Apply dividend discount to all OTHER non-lifted members for this ChitMonth
      if (dividendPerMember > 0) {
        const otherMemberships = await queryRunner.manager.find(ChitMembership, {
          where: { chitId: membership.chitId },
        });

        for (const otherMs of otherMemberships) {
          if (otherMs.id !== membership.id && otherMs.status !== MembershipStatus.LIFTED) {
            const otherDue = await queryRunner.manager.findOne(MonthlyDue, {
              where: { membershipId: otherMs.id, chitMonthId: chitMonth.id },
            });

            if (otherDue) {
              const baseScheduled = parseFloat(otherMs.customInstallment as any) || parseFloat(membership.chit?.defaultInstallment as any) || 0;
              otherDue.scheduledDue = Math.max(0, CurrencyUtil.subtract(baseScheduled, dividendPerMember));
              await queryRunner.manager.save(otherDue);
              await this.ledgerService.recalculateMembershipLedger(otherMs.id, queryRunner.manager);
            }
          }
        }
      }

      await queryRunner.commitTransaction();

      await this.auditService.log({
        actorId,
        action: AuditAction.LIFT_CONFIRMED,
        entityName: 'LiftEvent',
        entityId: savedLift.id,
        afterState: savedLift,
        reason: `Lift confirmed for ${membership.member?.fullName} (Seat ${membership.seatNumber}) in ${membership.chit?.chitCode}. Payout: ₹${savedLift.amountReleased}`,
      });

      return this.findOne(savedLift.id);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
