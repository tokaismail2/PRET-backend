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
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
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
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
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
  @IsIn(['generator', 'factory', 'driver'], {
    message: 'Invalid role. Must be one of: generator, factory, driver',
  })
  role?: 'generator' | 'factory' | 'driver';

  @ValidateIf((o) => o.role === 'generator')
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