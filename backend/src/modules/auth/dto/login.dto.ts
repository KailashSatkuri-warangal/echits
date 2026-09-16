import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin@sudhakarchits.com or 9845012345' })
  @IsString({ message: 'Email or Phone must be a string' })
  @IsNotEmpty({ message: 'Email or Phone is required' })
  email: string;

  @ApiProperty({ example: 'Admin@123' })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password: string;
}
