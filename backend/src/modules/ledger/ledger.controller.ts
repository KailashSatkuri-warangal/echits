import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LedgerService } from './ledger.service';
import { CreateAdjustmentDto } from './dto/create-adjustment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums';

@ApiTags('ledger')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ledger')
export class LedgerController {
  constructor(private ledgerService: LedgerService) {}

  @Get('membership/:membershipId')
  @ApiOperation({ summary: 'Get full chronological ledger for a chit membership' })
  getMembershipLedger(@Param('membershipId') membershipId: string) {
    return this.ledgerService.getMembershipLedger(membershipId);
  }

  @Get('due/:dueId/calculate')
  @ApiOperation({ summary: 'Get authoritative financial calculation breakdown for a specific monthly due' })
  getDueCalculation(@Param('dueId') dueId: string) {
    return this.ledgerService.getDueCalculation(dueId);
  }

  @Post('adjustments')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Grant an approved adjustment or interest waiver for a monthly due' })
  addAdjustment(@Body() dto: CreateAdjustmentDto, @CurrentUser('id') actorId: string) {
    return this.ledgerService.addAdjustment(dto, actorId);
  }
}
