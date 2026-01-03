import { IsEmail } from 'class-validator';

export class ForgetPasswordRequestDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;
}

