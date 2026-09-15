import { IsEnum, IsNotEmpty, IsNumber, IsString, IsUUID, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AdjustmentType } from '../../../common/enums';

export class CreateAdjustmentDto {
  @ApiProperty({ example: 'due-uuid' })
  @IsUUID()
  @IsNotEmpty()
  monthlyDueId: string;

  @ApiProperty({ enum: AdjustmentType, default: AdjustmentType.WAIVER })
  @IsEnum(AdjustmentType)
  adjustmentType: AdjustmentType;

  @ApiProperty({ example: 100 })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ example: 'Approved 50% interest waiver on hardship grounds' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}
