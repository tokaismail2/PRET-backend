import { IsString, Length, MinLength } from 'class-validator';

export class VerifyPhoneDto {
  @IsString()
  @MinLength(1, { message: 'Phone number is required' })
  phone: string;

  @IsString()
  @Length(6, 6, { message: 'Code must be exactly 6 characters' })
  code: string;
}

