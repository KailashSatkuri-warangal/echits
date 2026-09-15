import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DailyClosing } from '../../entities/daily-closing.entity';
import { Payment } from '../../entities/payment.entity';
import { DailyClosingService } from './daily-closing.service';
import { DailyClosingController } from './daily-closing.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [TypeOrmModule.forFeature([DailyClosing, Payment]), AuditModule],
  controllers: [DailyClosingController],
  providers: [DailyClosingService],
  exports: [DailyClosingService],
})
export class DailyClosingModule {}
