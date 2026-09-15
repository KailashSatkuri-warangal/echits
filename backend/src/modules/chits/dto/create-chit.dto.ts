import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ChitStatus } from '../../../common/enums';

export class CreateChitDto {
  @ApiProperty({ example: 'CHIT-5L-20M' })
  @IsString()
  @IsNotEmpty()
  chitCode: string;

  @ApiProperty({ example: '5 Lakhs 20 Months Group' })
  @IsString()
  @IsNotEmpty()
  chitName: string;

  @ApiProperty({ example: 500000 })
  @IsNumber()
  totalValue: number;

  @ApiProperty({ example: 20 })
  @IsNumber()
  @Min(2)
  capacity: number;

  @ApiProperty({ example: 9 })
  @IsNumber()
  @Min(1)
  @Max(12)
  startMonth: number;

  @ApiProperty({ example: 2026 })
  @IsNumber()
  @Min(2020)
  startYear: number;

  @ApiProperty({ example: 4 })
  @IsNumber()
  @Min(1)
  @Max(12)
  endMonth: number;

  @ApiProperty({ example: 2028 })
  @IsNumber()
  @Min(2020)
  endYear: number;

  @ApiProperty({ example: 25000, required: false })
  @IsNumber()
  @IsOptional()
  defaultInstallment?: number;

  @ApiProperty({ example: 10, required: false })
  @IsNumber()
  @Min(1)
  @Max(28)
  @IsOptional()
  dueDay?: number;

  @ApiProperty({ example: 5, required: false })
  @IsNumber()
  @IsOptional()
  gracePeriodDays?: number;

  @ApiProperty({ example: 2.0, required: false })
  @IsNumber()
  @IsOptional()
  defaultInterestRate?: number;

  @ApiProperty({ example: 0, required: false })
  @IsNumber()
  @IsOptional()
  lateFee?: number;

  @ApiProperty({ enum: ChitStatus, default: ChitStatus.ACTIVE, required: false })
  @IsEnum(ChitStatus)
  @IsOptional()
  status?: ChitStatus;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateChitDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  chitName?: string;

  @ApiProperty({ enum: ChitStatus, required: false })
  @IsEnum(ChitStatus)
  @IsOptional()
  status?: ChitStatus;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  defaultInterestRate?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  lateFee?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  gracePeriodDays?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
