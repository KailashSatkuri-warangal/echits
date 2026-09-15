import { Module } from '@nestjs/common';
import { PaymentsModule } from '../payments/payments.module';
import { MembersModule } from '../members/members.module';
import { ChitsModule } from '../chits/chits.module';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';

@Module({
  imports: [PaymentsModule, MembersModule, ChitsModule],
  controllers: [DocumentsController],
  providers: [DocumentsService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
