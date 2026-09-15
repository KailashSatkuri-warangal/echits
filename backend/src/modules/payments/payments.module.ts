import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from '../../entities/payment.entity';
import { PaymentAllocation } from '../../entities/payment-allocation.entity';
import { MonthlyDue } from '../../entities/monthly-due.entity';
import { Member } from '../../entities/member.entity';
import { Chit } from '../../entities/chit.entity';
import { ChitMembership } from '../../entities/chit-membership.entity';
import { MemberAdvance } from '../../entities/member-advance.entity';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { LedgerModule } from '../ledger/ledger.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Payment,
      PaymentAllocation,
      MonthlyDue,
      Member,
      Chit,
      ChitMembership,
      MemberAdvance,
    ]),
    LedgerModule,
    AuditModule,
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
