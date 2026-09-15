import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ChitsService } from './chits.service';
import { CreateChitDto, UpdateChitDto } from './dto/create-chit.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums';

@ApiTags('chits')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('chits')
export class ChitsController {
  constructor(private chitsService: ChitsService) {}

  @Get()
  @ApiOperation({ summary: 'List all chits with aggregated statistics' })
  findAll() {
    return this.chitsService.findAll();
  }

  @Get(':id/360')
  @ApiOperation({ summary: 'Get complete Chit 360° overview, member seats, and monthly grid' })
  get360(@Param('id') id: string) {
    return this.chitsService.getChit360(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single chit by ID' })
  findOne(@Param('id') id: string) {
    return this.chitsService.findOne(id);
  }

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Create a new chit scheme with automatic month schedule generation' })
  create(@Body() dto: CreateChitDto, @CurrentUser('id') actorId: string) {
    return this.chitsService.create(dto, actorId);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Update chit scheme parameters' })
  update(@Param('id') id: string, @Body() dto: UpdateChitDto, @CurrentUser('id') actorId: string) {
    return this.chitsService.update(id, dto, actorId);
  }
}
