import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LiftEvent } from '../../entities/lift-event.entity';
import { ChitMembership } from '../../entities/chit-membership.entity';
import { ChitMonth } from '../../entities/chit-month.entity';
import { Chit } from '../../entities/chit.entity';
import { MonthlyDue } from '../../entities/monthly-due.entity';
import { LiftService } from './lift.service';
import { LiftController } from './lift.controller';
import { LedgerModule } from '../ledger/ledger.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([LiftEvent, ChitMembership, ChitMonth, Chit, MonthlyDue]),
    LedgerModule,
    AuditModule,
  ],
  controllers: [LiftController],
  providers: [LiftService],
  exports: [LiftService],
})
export class LiftModule {}
