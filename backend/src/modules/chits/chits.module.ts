import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Chit } from '../../entities/chit.entity';
import { ChitMonth } from '../../entities/chit-month.entity';
import { ChitMembership } from '../../entities/chit-membership.entity';
import { MonthlyDue } from '../../entities/monthly-due.entity';
import { Payment } from '../../entities/payment.entity';
import { ChitsService } from './chits.service';
import { ChitsController } from './chits.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Chit, ChitMonth, ChitMembership, MonthlyDue, Payment]),
    AuditModule,
  ],
  controllers: [ChitsController],
  providers: [ChitsService],
  exports: [ChitsService],
})
export class ChitsModule {}
