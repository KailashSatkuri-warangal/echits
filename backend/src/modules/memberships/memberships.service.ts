import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ChitMembership } from '../../entities/chit-membership.entity';
import { Member } from '../../entities/member.entity';
import { Chit } from '../../entities/chit.entity';
import { ChitMonth } from '../../entities/chit-month.entity';
import { MonthlyDue } from '../../entities/monthly-due.entity';
import { CreateMembershipDto } from './dto/create-membership.dto';
import { AuditService } from '../audit/audit.service';
import { AuditAction, DueStatus, MembershipStatus } from '../../common/enums';
import { CurrencyUtil } from '../../common/utils/currency.util';

@Injectable()
export class MembershipsService {
  constructor(
    @InjectRepository(ChitMembership)
    private membershipRepo: Repository<ChitMembership>,
    @InjectRepository(Member)
    private memberRepo: Repository<Member>,
    @InjectRepository(Chit)
    private chitRepo: Repository<Chit>,
    @InjectRepository(ChitMonth)
    private monthRepo: Repository<ChitMonth>,
    @InjectRepository(MonthlyDue)
    private dueRepo: Repository<MonthlyDue>,
    private dataSource: DataSource,
    private auditService: AuditService,
  ) {}

  async findByChit(chitId: string) {
    return this.membershipRepo.find({
      where: { chitId },
      relations: ['member', 'dues', 'dues.chitMonth'],
      order: { seatNumber: 'ASC' },
    });
  }

  async create(dto: CreateMembershipDto, actorId?: string) {
    const chit = await this.chitRepo.findOne({
      where: { id: dto.chitId },
      relations: ['months', 'memberships'],
    });

    if (!chit) {
      throw new NotFoundException(`Chit with ID ${dto.chitId} not found`);
    }

    if (dto.seatNumber > chit.capacity || dto.seatNumber < 1) {
      throw new BadRequestException(`Seat number ${dto.seatNumber} is out of bounds (1 - ${chit.capacity})`);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let memberId = dto.memberId;

      // If newMember details provided, create new member
      if (!memberId && dto.newMember) {
        let memberCode = dto.newMember.memberCode;
        if (!memberCode) {
          const count = await queryRunner.manager.count(Member);
          memberCode = `MEM-${1001 + count}`;
        }

        const newMem = queryRunner.manager.create(Member, {
          ...dto.newMember,
          memberCode,
          status: 'ACTIVE',
        });
        const savedMem = await queryRunner.manager.save(newMem);
        memberId = savedMem.id;
      }

      if (!memberId) {
        throw new BadRequestException('Either memberId or newMember details must be provided');
      }

      // Check duplicate seat
      const existingSeat = await queryRunner.manager.findOne(ChitMembership, {
        where: { chitId: dto.chitId, seatNumber: dto.seatNumber },
      });
      if (existingSeat) {
        throw new ConflictException(`Seat number ${dto.seatNumber} is already occupied in this chit`);
      }

      // Check duplicate active membership for member in this chit
      const existingMember = await queryRunner.manager.findOne(ChitMembership, {
        where: { chitId: dto.chitId, memberId, status: MembershipStatus.ACTIVE },
      });
      if (existingMember) {
        throw new ConflictException('This member already has an active membership in this chit');
      }

      const membership = queryRunner.manager.create(ChitMembership, {
        chitId: dto.chitId,
        memberId,
        seatNumber: dto.seatNumber,
        joiningDate: dto.joiningDate || new Date().toISOString().slice(0, 10),
        customInstallment: dto.customInstallment || null,
        openingBalance: dto.openingBalance || 0,
        status: dto.status || MembershipStatus.ACTIVE,
      });

      const savedMembership = await queryRunner.manager.save(membership);

      // Generate initial MonthlyDue records for all ChitMonths
      const months = await queryRunner.manager.find(ChitMonth, {
        where: { chitId: dto.chitId },
        order: { monthSequence: 'ASC' },
      });

      const scheduledInstallment = dto.customInstallment || chit.defaultInstallment;
      const dues: MonthlyDue[] = [];

      for (let i = 0; i < months.length; i++) {
        const month = months[i];
        const isFirstMonth = i === 0;
        const prevBal = isFirstMonth ? (dto.openingBalance || 0) : 0;
        const totalDue = CurrencyUtil.add(prevBal, scheduledInstallment);

        const due = queryRunner.manager.create(MonthlyDue, {
          membershipId: savedMembership.id,
          chitMonthId: month.id,
          scheduledDue: scheduledInstallment,
          previousBalance: prevBal,
          interestBase: 0,
          interestRate: 0,
          interestAmount: 0,
          lateFee: 0,
          adjustmentAmount: 0,
          totalDue,
          totalPaid: 0,
          balanceDue: totalDue,
          status: DueStatus.PENDING,
          version: 1,
        });

        dues.push(due);
      }

      await queryRunner.manager.save(MonthlyDue, dues);
      await queryRunner.commitTransaction();

      await this.auditService.log({
        actorId,
        action: AuditAction.CREATE,
        entityName: 'ChitMembership',
        entityId: savedMembership.id,
        afterState: savedMembership,
        reason: `Enrolled member into seat ${savedMembership.seatNumber} of chit ${chit.chitCode}`,
      });

      return this.membershipRepo.findOne({
        where: { id: savedMembership.id },
        relations: ['member', 'chit', 'dues', 'dues.chitMonth'],
      });
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
