import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums';

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports')
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('dashboard-kpis')
  @ApiOperation({ summary: 'Get live Dashboard KPIs, attention items, and recent transactions' })
  getDashboardKpis() {
    return this.reportsService.getDashboardKpis();
  }

  @Get('daily-collection')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.ACCOUNTANT, Role.COLLECTION_STAFF)
  @ApiOperation({ summary: 'Get daily collection summary breakdown by payment mode and staff' })
  getDailyCollection(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const today = new Date().toISOString().slice(0, 10);
    return this.reportsService.getDailyCollectionReport(startDate || today, endDate || today);
  }

  @Get('chit-wise')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.ACCOUNTANT)
  @ApiOperation({ summary: 'Get chit-wise scheme performance, expected vs actual collections' })
  getChitWise() {
    return this.reportsService.getChitWiseReport();
  }

  @Get('overdue-ageing')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.ACCOUNTANT)
  @ApiOperation({ summary: 'Get overdue ageing analysis grouped into 30, 60, 90, 90+ day buckets' })
  getOverdueAgeing() {
    return this.reportsService.getOverdueAgeingReport();
  }
}
