import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../../entities/notification.entity';
import { MonthlyDue } from '../../entities/monthly-due.entity';
import { NotificationCategory, DueStatus } from '../../common/enums';
import { CurrencyUtil } from '../../common/utils/currency.util';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notifRepo: Repository<Notification>,
    @InjectRepository(MonthlyDue)
    private dueRepo: Repository<MonthlyDue>,
  ) {}

  async findAll(userId?: string) {
    const qb = this.notifRepo.createQueryBuilder('n').orderBy('n.createdAt', 'DESC').take(50);
    if (userId) {
      qb.where('n.userId = :userId OR n.userId IS NULL', { userId });
    }
    return qb.getMany();
  }

  async markAsRead(id: string) {
    await this.notifRepo.update(id, { isRead: true });
    return { success: true };
  }

  async markAllAsRead(userId?: string) {
    const qb = this.notifRepo.createQueryBuilder().update(Notification).set({ isRead: true });
    if (userId) {
      qb.where('userId = :userId OR userId IS NULL', { userId });
    }
    await qb.execute();
    return { success: true };
  }

  async generateSystemAlerts() {
    const todayStr = new Date().toISOString().slice(0, 10);
    const dues = await this.dueRepo.find({
      relations: ['membership', 'membership.member', 'membership.chit', 'chitMonth'],
    });

    const memberPendingMap = new Map<string, { member: any; chits: Map<string, number>; total: number }>();

    for (const due of dues) {
      const bal = parseFloat(due.balanceDue as any) || 0;
      if (bal > 0 && due.membership?.member) {
        const mId = due.membership.member.id;
        if (!memberPendingMap.has(mId)) {
          memberPendingMap.set(mId, {
            member: due.membership.member,
            chits: new Map(),
            total: 0,
          });
        }
        const rec = memberPendingMap.get(mId)!;
        const chitCode = due.membership.chit?.chitCode || 'CHIT';
        rec.chits.set(chitCode, CurrencyUtil.add(rec.chits.get(chitCode) || 0, bal));
        rec.total = CurrencyUtil.add(rec.total, bal);
      }
    }

    const createdNotifs: Notification[] = [];

    // Check Multi-Chit pending notifications
    for (const [memberId, info] of memberPendingMap.entries()) {
      if (info.chits.size > 1) {
        const chitBreakdowns = Array.from(info.chits.entries())
          .map(([c, amt]) => `${c}: ${CurrencyUtil.formatINR(amt)}`)
          .join(', ');

        const notif = this.notifRepo.create({
          category: NotificationCategory.MULTI_CHIT_PENDING,
          title: `Multiple Chits Pending: ${info.member.fullName}`,
          message: `${info.member.fullName} has pending payments in ${info.chits.size} chits (${chitBreakdowns}). Total: ${CurrencyUtil.formatINR(info.total)}`,
          metadataJson: JSON.stringify({ memberId, total: info.total }),
          isRead: false,
        });
        createdNotifs.push(notif);
      }
    }

    if (createdNotifs.length > 0) {
      await this.notifRepo.save(createdNotifs);
    }

    return { generated: createdNotifs.length };
  }
}
