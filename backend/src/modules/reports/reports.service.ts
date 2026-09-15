import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThan, MoreThan } from 'typeorm';
import { Payment } from '../../entities/payment.entity';
import { MonthlyDue } from '../../entities/monthly-due.entity';
import { Chit } from '../../entities/chit.entity';
import { Member } from '../../entities/member.entity';
import { ChitMembership } from '../../entities/chit-membership.entity';
import { LiftEvent } from '../../entities/lift-event.entity';
import { DueStatus, PaymentMode } from '../../common/enums';
import { CurrencyUtil } from '../../common/utils/currency.util';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Payment)
    private paymentRepo: Repository<Payment>,
    @InjectRepository(MonthlyDue)
    private dueRepo: Repository<MonthlyDue>,
    @InjectRepository(Chit)
    private chitRepo: Repository<Chit>,
    @InjectRepository(Member)
    private memberRepo: Repository<Member>,
    @InjectRepository(ChitMembership)
    private membershipRepo: Repository<ChitMembership>,
    @InjectRepository(LiftEvent)
    private liftRepo: Repository<LiftEvent>,
  ) {}

  async getDashboardKpis() {
    const todayStr = new Date().toISOString().slice(0, 10);
    const startOfToday = new Date(`${todayStr}T00:00:00.000Z`);
    const endOfToday = new Date(`${todayStr}T23:59:59.999Z`);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // 1. Today's Collections
    const todayPayments = await this.paymentRepo.find({
      where: { collectedAt: Between(startOfToday, endOfToday), isReversed: false },
    });
    const todayCollection = todayPayments.reduce(
      (sum, p) => CurrencyUtil.add(sum, parseFloat(p.totalAmount as any) || 0),
      0,
    );

    // 2. Month's Collections
    const monthPayments = await this.paymentRepo.find({
      where: { collectedAt: Between(startOfMonth, endOfMonth), isReversed: false },
    });
    const monthCollection = monthPayments.reduce(
      (sum, p) => CurrencyUtil.add(sum, parseFloat(p.totalAmount as any) || 0),
      0,
    );

    // 3. Outstanding, Overdue, Interest Pending, Due Today
    const allDues = await this.dueRepo.find({
      relations: ['chitMonth', 'membership', 'membership.member', 'membership.chit'],
    });

    let pendingAmount = 0;
    let overdueAmount = 0;
    let interestPending = 0;
    let dueTodayAmount = 0;
    let dueTodayCount = 0;
    let overdueCount = 0;

    const attentionItems: any[] = [];
    const memberPendingCountMap = new Map<string, { member: any; chits: Map<string, number>; total: number }>();

    allDues.forEach((due) => {
      const bal = parseFloat(due.balanceDue as any) || 0;
      const int = parseFloat(due.interestAmount as any) || 0;
      const paid = parseFloat(due.totalPaid as any) || 0;

      if (bal > 0) {
        pendingAmount = CurrencyUtil.add(pendingAmount, bal);

        // Interest pending: if not fully covered by payments
        if (paid < int) {
          interestPending = CurrencyUtil.add(interestPending, int - paid);
        }

        if (due.chitMonth?.dueDate === todayStr) {
          dueTodayAmount = CurrencyUtil.add(dueTodayAmount, bal);
          dueTodayCount++;
        }

        if (due.status === DueStatus.OVERDUE || (due.chitMonth?.graceDate && todayStr > due.chitMonth.graceDate)) {
          overdueAmount = CurrencyUtil.add(overdueAmount, bal);
          overdueCount++;
        }

        // Aggregate for multi-chit alerts
        const memberId = due.membership?.memberId;
        if (memberId && due.membership?.member) {
          if (!memberPendingCountMap.has(memberId)) {
            memberPendingCountMap.set(memberId, {
              member: due.membership.member,
              chits: new Map(),
              total: 0,
            });
          }
          const rec = memberPendingCountMap.get(memberId)!;
          const chitCode = due.membership?.chit?.chitCode || 'CHIT';
          rec.chits.set(chitCode, CurrencyUtil.add(rec.chits.get(chitCode) || 0, bal));
          rec.total = CurrencyUtil.add(rec.total, bal);
        }
      }
    });

    // Build Attention Items
    if (dueTodayCount > 0) {
      attentionItems.push({
        id: 'due-today',
        type: 'DUE_TODAY',
        title: 'Dues Payable Today',
        count: dueTodayCount,
        amount: dueTodayAmount,
        severity: 'info',
        description: `${dueTodayCount} members have dues maturing today`,
      });
    }

    if (overdueCount > 0) {
      attentionItems.push({
        id: 'overdue',
        type: 'OVERDUE',
        title: 'Overdue Dues Pending',
        count: overdueCount,
        amount: overdueAmount,
        severity: 'danger',
        description: `${overdueCount} installments have crossed the grace period`,
      });
    }

    // Multi-chit pending members
    let multiChitCount = 0;
    let multiChitTotal = 0;
    memberPendingCountMap.forEach((val) => {
      if (val.chits.size > 1) {
        multiChitCount++;
        multiChitTotal = CurrencyUtil.add(multiChitTotal, val.total);
      }
    });

    if (multiChitCount > 0) {
      attentionItems.push({
        id: 'multi-chit',
        type: 'MULTI_CHIT_PENDING',
        title: 'Multiple Chits Pending',
        count: multiChitCount,
        amount: multiChitTotal,
        severity: 'warning',
        description: `${multiChitCount} members have pending dues in 2 or more chits`,
      });
    }

    if (interestPending > 0) {
      attentionItems.push({
        id: 'interest-pending',
        type: 'INTEREST_PENDING',
        title: 'Accrued Interest Pending',
        count: 1,
        amount: interestPending,
        severity: 'warning',
        description: `Unpaid interest on overdue carry-forward balances`,
      });
    }

    // Recent payments (latest 5)
    const recentPayments = await this.paymentRepo.find({
      relations: ['member', 'chit', 'collectedByUser'],
      order: { collectedAt: 'DESC' },
      take: 5,
    });

    return {
      kpis: {
        todayCollection,
        monthCollection,
        dueTodayAmount,
        dueTodayCount,
        pendingAmount,
        overdueAmount,
        overdueCount,
        interestPending,
      },
      attentionItems,
      recentPayments,
    };
  }

  async getDailyCollectionReport(startDate: string, endDate: string) {
    const start = new Date(`${startDate}T00:00:00.000Z`);
    const end = new Date(`${endDate}T23:59:59.999Z`);

    const payments = await this.paymentRepo.find({
      where: { collectedAt: Between(start, end), isReversed: false },
      relations: ['member', 'chit', 'collectedByUser'],
      order: { collectedAt: 'DESC' },
    });

    let total = 0;
    const modeBreakdown = { CASH: 0, UPI: 0, BANK_TRANSFER: 0, CHEQUE: 0, OTHER: 0 };
    const staffBreakdown = new Map<string, { name: string; count: number; total: number }>();

    payments.forEach((p) => {
      const amt = parseFloat(p.totalAmount as any) || 0;
      total = CurrencyUtil.add(total, amt);
      modeBreakdown[p.paymentMode] = CurrencyUtil.add(modeBreakdown[p.paymentMode] || 0, amt);

      const staffId = p.collectedBy || 'unknown';
      const staffName = p.collectedByUser?.name || 'Staff';
      if (!staffBreakdown.has(staffId)) {
        staffBreakdown.set(staffId, { name: staffName, count: 0, total: 0 });
      }
      const s = staffBreakdown.get(staffId)!;
      s.count++;
      s.total = CurrencyUtil.add(s.total, amt);
    });

    return {
      startDate,
      endDate,
      totalCollected: total,
      totalTransactions: payments.length,
      modeBreakdown,
      staffSummary: Array.from(staffBreakdown.values()),
      items: payments,
    };
  }

  async getChitWiseReport() {
    const chits = await this.chitRepo.find({
      relations: ['memberships', 'memberships.dues'],
      order: { createdAt: 'DESC' },
    });

    return chits.map((c) => {
      let expected = 0;
      let collected = 0;
      let pending = 0;
      let overdue = 0;
      let interest = 0;

      (c.memberships || []).forEach((ms) => {
        (ms.dues || []).forEach((d) => {
          expected = CurrencyUtil.add(expected, parseFloat(d.totalDue as any) || 0);
          collected = CurrencyUtil.add(collected, parseFloat(d.totalPaid as any) || 0);
          pending = CurrencyUtil.add(pending, parseFloat(d.balanceDue as any) || 0);
          interest = CurrencyUtil.add(interest, parseFloat(d.interestAmount as any) || 0);
          if (d.status === DueStatus.OVERDUE) {
            overdue = CurrencyUtil.add(overdue, parseFloat(d.balanceDue as any) || 0);
          }
        });
      });

      return {
        id: c.id,
        chitCode: c.chitCode,
        chitName: c.chitName,
        totalValue: c.totalValue,
        capacity: c.capacity,
        enrolled: c.memberships?.length || 0,
        status: c.status,
        expected,
        collected,
        pending,
        overdue,
        interest,
        collectionPercentage: expected > 0 ? CurrencyUtil.round((collected / expected) * 100) : 0,
      };
    });
  }

  async getOverdueAgeingReport() {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    const overdueDues = await this.dueRepo
      .createQueryBuilder('d')
      .innerJoinAndSelect('d.chitMonth', 'cm')
      .innerJoinAndSelect('d.membership', 'ms')
      .innerJoinAndSelect('ms.member', 'm')
      .innerJoinAndSelect('ms.chit', 'c')
      .where('d.balanceDue > 0')
      .andWhere('cm.graceDate < :today', { today: todayStr })
      .getMany();

    const buckets = {
      bucket0_30: { label: '1 - 30 Days', count: 0, amount: 0, items: [] as any[] },
      bucket31_60: { label: '31 - 60 Days', count: 0, amount: 0, items: [] as any[] },
      bucket61_90: { label: '61 - 90 Days', count: 0, amount: 0, items: [] as any[] },
      bucket90_plus: { label: '90+ Days', count: 0, amount: 0, items: [] as any[] },
    };

    overdueDues.forEach((d) => {
      const graceDate = new Date(d.chitMonth.graceDate);
      const diffDays = Math.floor((now.getTime() - graceDate.getTime()) / (1000 * 60 * 60 * 24));
      const bal = parseFloat(d.balanceDue as any) || 0;

      const item = {
        dueId: d.id,
        memberCode: d.membership.member.memberCode,
        memberName: d.membership.member.fullName,
        memberPhone: d.membership.member.phone,
        chitCode: d.membership.chit.chitCode,
        monthSequence: d.chitMonth.monthSequence,
        dueDate: d.chitMonth.dueDate,
        graceDate: d.chitMonth.graceDate,
        daysOverdue: diffDays,
        balanceDue: bal,
        interestAmount: parseFloat(d.interestAmount as any) || 0,
      };

      if (diffDays <= 30) {
        buckets.bucket0_30.count++;
        buckets.bucket0_30.amount = CurrencyUtil.add(buckets.bucket0_30.amount, bal);
        buckets.bucket0_30.items.push(item);
      } else if (diffDays <= 60) {
        buckets.bucket31_60.count++;
        buckets.bucket31_60.amount = CurrencyUtil.add(buckets.bucket31_60.amount, bal);
        buckets.bucket31_60.items.push(item);
      } else if (diffDays <= 90) {
        buckets.bucket61_90.count++;
        buckets.bucket61_90.amount = CurrencyUtil.add(buckets.bucket61_90.amount, bal);
        buckets.bucket61_90.items.push(item);
      } else {
        buckets.bucket90_plus.count++;
        buckets.bucket90_plus.amount = CurrencyUtil.add(buckets.bucket90_plus.amount, bal);
        buckets.bucket90_plus.items.push(item);
      }
    });

    return buckets;
  }
}
