import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MembershipsService } from './memberships.service';
import { CreateMembershipDto } from './dto/create-membership.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums';

@ApiTags('memberships')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('memberships')
export class MembershipsController {
  constructor(private membershipsService: MembershipsService) {}

  @Get('chit/:chitId')
  @ApiOperation({ summary: 'Get all member seat allocations for a chit' })
  findByChit(@Param('chitId') chitId: string) {
    return this.membershipsService.findByChit(chitId);
  }

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.COLLECTION_STAFF)
  @ApiOperation({ summary: 'Assign a seat and enroll a member into a chit' })
  create(@Body() dto: CreateMembershipDto, @CurrentUser('id') actorId: string) {
    return this.membershipsService.create(dto, actorId);
  }
}
