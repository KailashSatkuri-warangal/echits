import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DailyClosingService } from './daily-closing.service';
import { CreateDailyClosingDto, ReconcileDailyClosingDto } from './dto/create-closing.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums';

@ApiTags('daily-closing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('daily-closing')
export class DailyClosingController {
  constructor(private closingService: DailyClosingService) {}

  @Get('history')
  @ApiOperation({ summary: 'Get daily closing history' })
  findAll() {
    return this.closingService.findAll();
  }

  @Get('today')
  @ApiOperation({ summary: 'Get or initialize live daily closing for today' })
  getToday(@CurrentUser('id') actorId: string) {
    const today = new Date().toISOString().slice(0, 10);
    return this.closingService.getClosingForDate(today, actorId);
  }

  @Get(':date')
  @ApiOperation({ summary: 'Get daily closing for a specific date' })
  getForDate(@Param('date') date: string, @CurrentUser('id') actorId: string) {
    return this.closingService.getClosingForDate(date, actorId);
  }

  @Post(':date/reconcile')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.ACCOUNTANT, Role.COLLECTION_STAFF)
  @ApiOperation({ summary: 'Reconcile and close the daily cash register' })
  reconcile(
    @Param('date') date: string,
    @Body() dto: ReconcileDailyClosingDto,
    @CurrentUser('id') actorId: string,
  ) {
    return this.closingService.reconcileClosing(date, dto, actorId);
  }
}
