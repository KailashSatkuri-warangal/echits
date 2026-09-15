import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, ILike } from 'typeorm';
import { Member } from '../../entities/member.entity';
import { ChitMembership } from '../../entities/chit-membership.entity';
import { MonthlyDue } from '../../entities/monthly-due.entity';
import { Payment } from '../../entities/payment.entity';
import { MemberAdvance } from '../../entities/member-advance.entity';
import { CreateMemberDto, UpdateMemberDto } from './dto/create-member.dto';
import { AuditService } from '../audit/audit.service';
import { AuditAction, DueStatus, ChitMonthStatus } from '../../common/enums';
import { CurrencyUtil } from '../../common/utils/currency.util';

@Injectable()
export class MembersService {
  constructor(
    @InjectRepository(Member)
    private memberRepo: Repository<Member>,
    @InjectRepository(ChitMembership)
    private membershipRepo: Repository<ChitMembership>,
    @InjectRepository(MonthlyDue)
    private dueRepo: Repository<MonthlyDue>,
    @InjectRepository(Payment)
    private paymentRepo: Repository<Payment>,
    @InjectRepository(MemberAdvance)
    private advanceRepo: Repository<MemberAdvance>,
    private auditService: AuditService,
  ) {}

  async search(query: string) {
    const trimmed = (query || '').trim();
    if (!trimmed) {
      return this.findAllSummaries(1, 20);
    }

    const members = await this.memberRepo
      .createQueryBuilder('m')
      .where('LOWER(m.fullName) LIKE LOWER(:q) OR m.phone LIKE :q OR LOWER(m.memberCode) LIKE LOWER(:q)', {
        q: `%${trimmed}%`,
      })
      .take(20)
      .getMany();

    const results = await Promise.all(members.map((m) => this.getMemberSummary(m)));
    return { items: results, total: results.length };
  }

  async findAllSummaries(page = 1, limit = 20) {
    const [members, total] = await this.memberRepo
      .createQueryBuilder('m')
      .orderBy('m.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const items = await Promise.all(members.map((m) => this.getMemberSummary(m)));
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getMemberSummary(member: Member) {
    const memberships = await this.membershipRepo.find({
      where: { memberId: member.id },
      relations: ['chit', 'dues', 'dues.chitMonth'],
    });

    let totalOutstanding = 0;
    let totalPaid = 0;
    let totalInterest = 0;
    let totalOverdue = 0;
    let pendingChitsCount = 0;

    const chitBreakdown = memberships.map((ms) => {
      let chitPending = 0;
      let chitPaid = 0;
      let chitInterest = 0;
      let chitOverdue = 0;
      let nextDue: MonthlyDue | null = null;

      const sortedDues = (ms.dues || []).sort((a, b) => (a.chitMonth?.monthSequence || 0) - (b.chitMonth?.monthSequence || 0));

      for (const due of sortedDues) {
        const bal = parseFloat(due.balanceDue as any) || 0;
        const paid = parseFloat(due.totalPaid as any) || 0;
        const interest = parseFloat(due.interestAmount as any) || 0;
        const isCurrentOrOverdue =
          due.status === DueStatus.OVERDUE ||
          due.status === DueStatus.PART_PAID ||
          (due.chitMonth && due.chitMonth.status === ChitMonthStatus.OPEN);

        chitPaid = CurrencyUtil.add(chitPaid, paid);
        chitInterest = CurrencyUtil.add(chitInterest, interest);

        if (isCurrentOrOverdue && bal > 0) {
          chitPending = CurrencyUtil.add(chitPending, bal);
        }

        if (due.status === DueStatus.OVERDUE) {
          chitOverdue = CurrencyUtil.add(chitOverdue, bal);
        }

        if (!nextDue && (due.status === DueStatus.PENDING || due.status === DueStatus.PART_PAID || due.status === DueStatus.OVERDUE)) {
          nextDue = due;
        }
      }

      if (chitPending > 0) {
        pendingChitsCount++;
      }

      totalOutstanding = CurrencyUtil.add(totalOutstanding, chitPending);
      totalPaid = CurrencyUtil.add(totalPaid, chitPaid);
      totalInterest = CurrencyUtil.add(totalInterest, chitInterest);
      totalOverdue = CurrencyUtil.add(totalOverdue, chitOverdue);

      return {
        membershipId: ms.id,
        chitId: ms.chit?.id,
        chitCode: ms.chit?.chitCode,
        chitName: ms.chit?.chitName,
        seatNumber: ms.seatNumber,
        status: ms.status,
        monthlyInstallment: ms.customInstallment || ms.chit?.defaultInstallment || 0,
        pendingAmount: chitPending,
        paidAmount: chitPaid,
        interestAmount: chitInterest,
        overdueAmount: chitOverdue,
        nextDueMonth: nextDue ? nextDue.chitMonth?.monthSequence : null,
        nextDueDate: nextDue ? nextDue.chitMonth?.dueDate : null,
        nextDueAmount: nextDue ? parseFloat(nextDue.balanceDue as any) : 0,
      };
    });

    const advances = await this.advanceRepo.find({ where: { memberId: member.id } });
    const totalAdvance = advances.reduce((sum, a) => CurrencyUtil.add(sum, parseFloat(a.creditBalance as any) || 0), 0);

    return {
      id: member.id,
      memberCode: member.memberCode,
      fullName: member.fullName,
      phone: member.phone,
      altPhone: member.altPhone,
      email: member.email,
      address: member.address,
      status: member.status,
      chitsCount: memberships.length,
      pendingChitsCount,
      totalOutstanding,
      totalPaid,
      totalInterest,
      totalOverdue,
      totalAdvance,
      chits: chitBreakdown,
    };
  }

  async getMember360(id: string) {
    const member = await this.memberRepo.findOne({ where: { id } });
    if (!member) {
      throw new NotFoundException(`Member with ID ${id} not found`);
    }

    const summary = await this.getMemberSummary(member);

    const payments = await this.paymentRepo.find({
      where: { memberId: id },
      relations: ['chit', 'collectedByUser', 'allocations', 'allocations.monthlyDue', 'allocations.monthlyDue.chitMonth', 'reversal'],
      order: { collectedAt: 'DESC' },
    });

    const memberships = await this.membershipRepo.find({
      where: { memberId: id },
      relations: ['chit', 'dues', 'dues.chitMonth', 'dues.allocations', 'liftEvents'],
      order: { createdAt: 'ASC' },
    });

    return {
      member,
      summary,
      memberships,
      paymentHistory: payments,
    };
  }

  async create(dto: CreateMemberDto, actorId?: string) {
    const existing = await this.memberRepo.findOne({
      where: [{ phone: dto.phone }],
    });

    if (existing) {
      throw new ConflictException(`Member with phone ${dto.phone} already exists (${existing.fullName} - ${existing.memberCode})`);
    }

    let memberCode = dto.memberCode;
    if (!memberCode) {
      const count = await this.memberRepo.count();
      memberCode = `MEM-${1001 + count}`;
    }

    const member = this.memberRepo.create({
      ...dto,
      memberCode,
      status: 'ACTIVE',
    });

    const saved = await this.memberRepo.save(member);

    await this.auditService.log({
      actorId,
      action: AuditAction.CREATE,
      entityName: 'Member',
      entityId: saved.id,
      afterState: saved,
      reason: `Created member ${saved.fullName} (${saved.memberCode})`,
    });

    return saved;
  }

  async update(id: string, dto: UpdateMemberDto, actorId?: string) {
    const member = await this.memberRepo.findOne({ where: { id } });
    if (!member) {
      throw new NotFoundException(`Member with ID ${id} not found`);
    }

    const beforeState = { ...member };
    Object.assign(member, dto);
    const updated = await this.memberRepo.save(member);

    await this.auditService.log({
      actorId,
      action: AuditAction.UPDATE,
      entityName: 'Member',
      entityId: updated.id,
      beforeState,
      afterState: updated,
      reason: `Updated member details for ${updated.fullName}`,
    });

    return updated;
  }
}
