import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../../entities/user.entity';
import { CreateUserDto, UpdateUserDto } from './dto/create-user.dto';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../../common/enums';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private auditService: AuditService,
  ) {}

  async findAll() {
    return this.userRepo.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async create(dto: CreateUserDto, actorId?: string) {
    const existing = await this.userRepo.findOne({
      where: [{ email: dto.email.toLowerCase() }, { phone: dto.phone }],
    });

    if (existing) {
      throw new ConflictException('User with this email or phone already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    const user = this.userRepo.create({
      name: dto.name,
      email: dto.email.toLowerCase(),
      phone: dto.phone,
      passwordHash,
      role: dto.role,
      isActive: true,
    });

    const saved = await this.userRepo.save(user);

    await this.auditService.log({
      actorId,
      action: AuditAction.CREATE,
      entityName: 'User',
      entityId: saved.id,
      afterState: { id: saved.id, email: saved.email, role: saved.role },
      reason: `Created user ${saved.email} with role ${saved.role}`,
    });

    return saved;
  }

  async update(id: string, dto: UpdateUserDto, actorId?: string) {
    const user = await this.findOne(id);
    const beforeState = { ...user };

    if (dto.name) user.name = dto.name;
    if (dto.email) user.email = dto.email.toLowerCase();
    if (dto.phone) user.phone = dto.phone;
    if (dto.role) user.role = dto.role;
    if (dto.isActive !== undefined) user.isActive = dto.isActive;

    if (dto.password) {
      const salt = await bcrypt.genSalt(10);
      user.passwordHash = await bcrypt.hash(dto.password, salt);
    }

    const updated = await this.userRepo.save(user);

    await this.auditService.log({
      actorId,
      action: AuditAction.UPDATE,
      entityName: 'User',
      entityId: updated.id,
      beforeState,
      afterState: { id: updated.id, email: updated.email, role: updated.role, isActive: updated.isActive },
      reason: `Updated user profile for ${updated.email}`,
    });

    return updated;
  }
}
