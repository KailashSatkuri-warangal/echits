import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LiftService } from './lift.service';
import { CreateLiftEventDto } from './dto/create-lift-event.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums';

@ApiTags('lift')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('lift-events')
export class LiftController {
  constructor(private liftService: LiftService) {}

  @Get()
  @ApiOperation({ summary: 'List all chit lift events' })
  findAll(@Query('chitId') chitId?: string) {
    return this.liftService.findAll(chitId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get lift event details by ID' })
  findOne(@Param('id') id: string) {
    return this.liftService.findOne(id);
  }

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Record auction lift, distribute dividend, and revise future schedule without rewriting history' })
  create(@Body() dto: CreateLiftEventDto, @CurrentUser('id') actorId: string) {
    return this.liftService.create(dto, actorId);
  }
}
