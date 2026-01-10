import { IsString, IsEmail, IsOptional, MinLength, IsEnum, IsIn } from 'class-validator';
import { UserRole } from '../../models/user.schema';

export class CreateUserDto {
  @IsString()
  readonly name: string;

  @IsEmail()
  readonly email: string;

  @IsString()
  @MinLength(6)
  readonly password: string;

  @IsOptional()
  @IsIn(['generator', 'factory', 'driver'], {
    message: 'invailed role',
  })
  readonly role?: UserRole; // optional, default to USER
}
