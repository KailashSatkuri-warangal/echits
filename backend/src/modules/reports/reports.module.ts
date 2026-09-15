import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from '../../entities/payment.entity';
import { MonthlyDue } from '../../entities/monthly-due.entity';
import { Chit } from '../../entities/chit.entity';
import { Member } from '../../entities/member.entity';
import { ChitMembership } from '../../entities/chit-membership.entity';
import { LiftEvent } from '../../entities/lift-event.entity';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Payment,
      MonthlyDue,
      Chit,
      Member,
      ChitMembership,
      LiftEvent,
    ]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
