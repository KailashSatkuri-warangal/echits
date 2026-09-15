import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Member } from '../../entities/member.entity';
import { ChitMembership } from '../../entities/chit-membership.entity';
import { MonthlyDue } from '../../entities/monthly-due.entity';
import { Payment } from '../../entities/payment.entity';
import { MemberAdvance } from '../../entities/member-advance.entity';
import { MembersService } from './members.service';
import { MembersController } from './members.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Member, ChitMembership, MonthlyDue, Payment, MemberAdvance]),
    AuditModule,
  ],
  controllers: [MembersController],
  providers: [MembersService],
  exports: [MembersService],
})
export class MembersModule {}
