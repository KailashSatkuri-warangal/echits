import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CommunicationsService } from './communications.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('communications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('communications')
export class CommunicationsController {
  constructor(private commsService: CommunicationsService) {}

  @Get('whatsapp/receipt/:paymentId')
  @ApiOperation({ summary: 'Generate WhatsApp receipt link and formatted text' })
  getReceiptWhatsApp(@Param('paymentId') paymentId: string) {
    return this.commsService.getReceiptWhatsAppMessage(paymentId);
  }

  @Get('whatsapp/reminder/:memberId')
  @ApiOperation({ summary: 'Generate WhatsApp multi-chit payment reminder link and message' })
  getReminderWhatsApp(@Param('memberId') memberId: string) {
    return this.commsService.getDueReminderWhatsAppMessage(memberId);
  }
}
