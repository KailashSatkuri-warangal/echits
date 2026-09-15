import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReversalsService } from './reversals.service';
import { ReversePaymentDto } from './dto/reverse-payment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums';

@ApiTags('reversals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reversals')
export class ReversalsController {
  constructor(private reversalsService: ReversalsService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Reverse a payment with mandatory reason and ledger balance restoration' })
  reversePayment(@Body() dto: ReversePaymentDto, @CurrentUser('id') actorId: string) {
    return this.reversalsService.reversePayment(dto, actorId);
  }
}
