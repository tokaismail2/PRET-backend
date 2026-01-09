import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsEnum,
  IsIn,
  IsObject,
  ValidateNested,
  ValidateIf,
  IsUppercase,
  IsNumber,
  IsLowercase,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UserRole } from '../../models/user.schema';
import { GeneratorType } from '../../models/generator.schema';

class AddressDto {
  @IsOptional()
  @IsString()
  street?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  zipCode?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsObject()
  coordinates?: {
    latitude?: number;
    longitude?: number;
  };
}

export class RegisterDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @IsUppercase({ message: 'Password must contain at least one uppercase letter' })
  @IsLowercase({ message: 'Password must contain at least one lowercase letter' })
  password: string;

  @IsString()
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  name: string;

  @IsOptional()
  @IsString()
  businessName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEnum(UserRole, {
    message: 'Role must be one of: generator, factory, driver',
  })
  role?: UserRole;

  @ValidateIf((o) => o.role === UserRole.GENERATOR)
  @IsEnum(GeneratorType, {
    message:
      'Generator type must be one of: hotel, restaurant, cafe, office, residential, warehouse, other',
  })
  generatorType?: GeneratorType;

  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto;

  @IsOptional()
  @IsIn(['email', 'phone'], {
    message: 'Verification method must be either "email" or "phone"',
  })
  verificationMethod?: 'email' | 'phone';
}
