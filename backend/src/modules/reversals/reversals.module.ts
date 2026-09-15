import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from '../../entities/payment.entity';
import { PaymentReversal } from '../../entities/payment-reversal.entity';
import { PaymentAllocation } from '../../entities/payment-allocation.entity';
import { MonthlyDue } from '../../entities/monthly-due.entity';
import { MemberAdvance } from '../../entities/member-advance.entity';
import { ReversalsService } from './reversals.service';
import { ReversalsController } from './reversals.controller';
import { LedgerModule } from '../ledger/ledger.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Payment,
      PaymentReversal,
      PaymentAllocation,
      MonthlyDue,
      MemberAdvance,
    ]),
    LedgerModule,
    AuditModule,
  ],
  controllers: [ReversalsController],
  providers: [ReversalsService],
  exports: [ReversalsService],
})
export class ReversalsModule {}
