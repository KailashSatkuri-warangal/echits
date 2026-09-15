import { Module } from '@nestjs/common';
import { PaymentsModule } from '../payments/payments.module';
import { MembersModule } from '../members/members.module';
import { CommunicationsService } from './communications.service';
import { CommunicationsController } from './communications.controller';

@Module({
  imports: [PaymentsModule, MembersModule],
  controllers: [CommunicationsController],
  providers: [CommunicationsService],
  exports: [CommunicationsService],
})
export class CommunicationsModule {}
