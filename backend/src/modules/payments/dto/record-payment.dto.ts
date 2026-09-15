import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentMode } from '../../../common/enums';

export class RecordPaymentDto {
  @ApiProperty({ example: 'member-uuid' })
  @IsUUID()
  @IsNotEmpty()
  memberId: string;

  @ApiProperty({ example: 'chit-uuid', required: false })
  @IsUUID()
  @IsOptional()
  chitId?: string;

  @ApiProperty({ example: 'monthly-due-uuid', required: false })
  @IsUUID()
  @IsOptional()
  monthlyDueId?: string;

  @ApiProperty({ example: 10000 })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({ enum: PaymentMode, default: PaymentMode.CASH })
  @IsEnum(PaymentMode)
  paymentMode: PaymentMode;

  @ApiProperty({ example: 'UPI-987654321', required: false })
  @IsString()
  @IsOptional()
  referenceNumber?: string;

  @ApiProperty({ example: 'Collection at office', required: false })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ example: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d' })
  @IsString()
  @IsNotEmpty()
  idempotencyKey: string;
}
