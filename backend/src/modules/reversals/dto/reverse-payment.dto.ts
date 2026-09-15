import { IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReversePaymentDto {
  @ApiProperty({ example: 'payment-uuid' })
  @IsUUID()
  @IsNotEmpty()
  paymentId: string;

  @ApiProperty({ example: 'Cheque bounced / Entry error reported by customer' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}
