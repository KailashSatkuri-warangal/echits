import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MonthlyDue } from '../../entities/monthly-due.entity';
import { ChitMembership } from '../../entities/chit-membership.entity';
import { ChitMonth } from '../../entities/chit-month.entity';
import { Chit } from '../../entities/chit.entity';
import { Adjustment } from '../../entities/adjustment.entity';
import { PaymentAllocation } from '../../entities/payment-allocation.entity';
import { LedgerService } from './ledger.service';
import { LedgerController } from './ledger.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([MonthlyDue, ChitMembership, ChitMonth, Chit, Adjustment, PaymentAllocation]),
    AuditModule,
  ],
  controllers: [LedgerController],
  providers: [LedgerService],
  exports: [LedgerService],
})
export class LedgerModule {}
