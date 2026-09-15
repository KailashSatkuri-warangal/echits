import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role, PaymentMode } from '../../common/enums';

@ApiTags('payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Get()
  @ApiOperation({ summary: 'List all payment transactions with filters and pagination' })
  findAll(
    @Query('memberId') memberId?: string,
    @Query('chitId') chitId?: string,
    @Query('paymentMode') paymentMode?: PaymentMode,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.paymentsService.findAll({ memberId, chitId, paymentMode, page: +page, limit: +limit });
  }

  @Get(':id/receipt')
  @ApiOperation({ summary: 'Get formatted receipt data for a payment' })
  getReceipt(@Param('id') id: string) {
    return this.paymentsService.getReceiptData(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment details by ID' })
  findOne(@Param('id') id: string) {
    return this.paymentsService.findOne(id);
  }

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.COLLECTION_STAFF, Role.ACCOUNTANT)
  @ApiOperation({ summary: 'Record a new payment with authoritative allocation and receipt generation' })
  recordPayment(@Body() dto: RecordPaymentDto, @CurrentUser('id') collectorId: string) {
    return this.paymentsService.recordPayment(dto, collectorId);
  }
}
