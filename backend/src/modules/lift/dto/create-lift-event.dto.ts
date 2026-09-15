import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLiftEventDto {
  @ApiProperty({ example: 'membership-uuid' })
  @IsUUID()
  @IsNotEmpty()
  membershipId: string;

  @ApiProperty({ example: 'chit-month-uuid' })
  @IsUUID()
  @IsNotEmpty()
  chitMonthId: string;

  @ApiProperty({ example: '2026-09-10' })
  @IsDateString()
  @IsNotEmpty()
  liftDate: string;

  @ApiProperty({ example: 75000 })
  @IsNumber()
  @Min(0)
  bidDiscount: number;

  @ApiProperty({ example: 25000, required: false })
  @IsNumber()
  @IsOptional()
  companyCommission?: number;

  @ApiProperty({ example: 25000, required: false })
  @IsNumber()
  @IsOptional()
  newInstallment?: number;

  @ApiProperty({ example: 'Auction won at ₹75,000 discount. Payout processed via NEFT', required: false })
  @IsString()
  @IsOptional()
  remarks?: string;
}
