import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDailyClosingDto {
  @ApiProperty({ example: '2026-09-15' })
  @IsDateString()
  @IsNotEmpty()
  closingDate: string;

  @ApiProperty({ example: 5000, required: false })
  @IsNumber()
  @IsOptional()
  openingCash?: number;
}

export class ReconcileDailyClosingDto {
  @ApiProperty({ example: 45000 })
  @IsNumber()
  @Min(0)
  actualClosing: number;

  @ApiProperty({ example: 'Cash counted in drawer: 9 x ₹500 notes + coins', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
