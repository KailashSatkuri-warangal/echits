import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChitMembership } from '../../entities/chit-membership.entity';
import { Member } from '../../entities/member.entity';
import { Chit } from '../../entities/chit.entity';
import { ChitMonth } from '../../entities/chit-month.entity';
import { MonthlyDue } from '../../entities/monthly-due.entity';
import { MembershipsService } from './memberships.service';
import { MembershipsController } from './memberships.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChitMembership, Member, Chit, ChitMonth, MonthlyDue]),
    AuditModule,
  ],
  controllers: [MembershipsController],
  providers: [MembershipsService],
  exports: [MembershipsService],
})
export class MembershipsModule {}
