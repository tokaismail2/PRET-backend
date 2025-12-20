import { IsString, IsEmail, IsOptional, MinLength, IsEnum, IsBoolean } from 'class-validator';
import { UserRole } from '../../models/user.schema';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  readonly name?: string;

  @IsOptional()
  @IsEmail()
  readonly email?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  readonly password?: string;

  @IsOptional()
  @IsEnum(UserRole)
  readonly role?: UserRole;

  @IsOptional()
  @IsBoolean()
  readonly isActive?: boolean;
}
