import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MembersService } from './members.service';
import { CreateMemberDto, UpdateMemberDto } from './dto/create-member.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums';

@ApiTags('members')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('members')
export class MembersController {
  constructor(private membersService: MembersService) {}

  @Get('search')
  @ApiOperation({ summary: 'Fast global search for members with multi-chit aggregation' })
  search(@Query('q') query: string) {
    return this.membersService.search(query);
  }

  @Get()
  @ApiOperation({ summary: 'List all members with summaries' })
  findAll(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.membersService.findAllSummaries(+page, +limit);
  }

  @Get(':id/360')
  @ApiOperation({ summary: 'Get complete Member 360° profile, chit memberships, and history' })
  get360(@Param('id') id: string) {
    return this.membersService.getMember360(id);
  }

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.COLLECTION_STAFF)
  @ApiOperation({ summary: 'Create a new member' })
  create(@Body() dto: CreateMemberDto, @CurrentUser('id') actorId: string) {
    return this.membersService.create(dto, actorId);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Update member profile' })
  update(@Param('id') id: string, @Body() dto: UpdateMemberDto, @CurrentUser('id') actorId: string) {
    return this.membersService.update(id, dto, actorId);
  }
}
