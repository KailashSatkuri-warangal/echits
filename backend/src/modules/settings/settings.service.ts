import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessSetting } from '../../entities/business-setting.entity';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../../common/enums';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(BusinessSetting)
    private settingRepo: Repository<BusinessSetting>,
    private auditService: AuditService,
  ) {}

  async getAll() {
    return this.settingRepo.find({ order: { group: 'ASC', key: 'ASC' } });
  }

  async getByKey(key: string, defaultValue: string = ''): Promise<string> {
    const setting = await this.settingRepo.findOne({ where: { key } });
    return setting ? setting.value : defaultValue;
  }

  async setKey(key: string, value: string, description?: string, group: string = 'SYSTEM', actorId?: string) {
    let setting = await this.settingRepo.findOne({ where: { key } });
    const beforeState = setting ? { ...setting } : null;

    if (!setting) {
      setting = this.settingRepo.create({ key, value, description, group });
    } else {
      setting.value = value;
      if (description) setting.description = description;
      if (group) setting.group = group;
    }

    const saved = await this.settingRepo.save(setting);

    await this.auditService.log({
      actorId,
      action: AuditAction.SETTING_CHANGED,
      entityName: 'BusinessSetting',
      entityId: saved.id,
      beforeState,
      afterState: saved,
      reason: `Updated setting ${key}`,
    });

    return saved;
  }
}
