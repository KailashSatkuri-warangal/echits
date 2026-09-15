import { IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MembershipStatus } from '../../../common/enums';
import { CreateMemberDto } from '../../members/dto/create-member.dto';

export class CreateMembershipDto {
  @ApiProperty({ example: 'chit-uuid' })
  @IsUUID()
  @IsNotEmpty()
  chitId: string;

  @ApiProperty({ example: 'member-uuid', required: false })
  @IsUUID()
  @IsOptional()
  memberId?: string;

  @ApiProperty({ required: false, type: CreateMemberDto })
  @IsOptional()
  newMember?: CreateMemberDto;

  @ApiProperty({ example: 1 })
  @IsNumber()
  seatNumber: number;

  @ApiProperty({ example: '2026-09-01', required: false })
  @IsDateString()
  @IsOptional()
  joiningDate?: string;

  @ApiProperty({ example: 25000, required: false })
  @IsNumber()
  @IsOptional()
  customInstallment?: number;

  @ApiProperty({ example: 0, required: false })
  @IsNumber()
  @IsOptional()
  openingBalance?: number;

  @ApiProperty({ enum: MembershipStatus, default: MembershipStatus.ACTIVE, required: false })
  @IsEnum(MembershipStatus)
  @IsOptional()
  status?: MembershipStatus;
}
