import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../../entities/audit-log.entity';
import { AuditAction } from '../../common/enums';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditRepo: Repository<AuditLog>,
  ) {}

  async log(params: {
    actorId?: string;
    action: AuditAction;
    entityName: string;
    entityId?: string;
    beforeState?: any;
    afterState?: any;
    reason?: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<AuditLog> {
    const entry = this.auditRepo.create({
      actorId: params.actorId,
      action: params.action,
      entityName: params.entityName,
      entityId: params.entityId,
      beforeStateJson: params.beforeState ? JSON.stringify(params.beforeState) : null,
      afterStateJson: params.afterState ? JSON.stringify(params.afterState) : null,
      reason: params.reason,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });

    return this.auditRepo.save(entry);
  }

  async findAll(query?: { entityName?: string; action?: AuditAction; page?: number; limit?: number }) {
    const page = query?.page || 1;
    const limit = query?.limit || 50;
    const qb = this.auditRepo
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.actor', 'actor')
      .orderBy('log.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (query?.entityName) {
      qb.andWhere('log.entityName = :entityName', { entityName: query.entityName });
    }

    if (query?.action) {
      qb.andWhere('log.action = :action', { action: query.action });
    }

    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
