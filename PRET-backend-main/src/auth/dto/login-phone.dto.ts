import { IsString, MinLength } from 'class-validator';

export class LoginPhoneDto {
  @IsString()
  @MinLength(10, { message: 'Please provide a valid phone number' })
  phone: string;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;
}

