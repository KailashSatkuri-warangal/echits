import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMemberDto {
  @ApiProperty({ example: 'MEM-1001', required: false })
  @IsString()
  @IsOptional()
  memberCode?: string;

  @ApiProperty({ example: 'Ravi Kumar' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ example: '9845012345' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: '9845012346', required: false })
  @IsString()
  @IsOptional()
  altPhone?: string;

  @ApiProperty({ example: 'ravi.kumar@example.com', required: false })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: 'No 45, 2nd Cross, Indiranagar, Bengaluru', required: false })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ example: 'AADHAAR', required: false })
  @IsString()
  @IsOptional()
  idProofType?: string;

  @ApiProperty({ example: '9876-5432-1098', required: false })
  @IsString()
  @IsOptional()
  idProofNumber?: string;

  @ApiProperty({ example: 'VIP Customer', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateMemberDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  altPhone?: string;

  @ApiProperty({ required: false })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  idProofType?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  idProofNumber?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
