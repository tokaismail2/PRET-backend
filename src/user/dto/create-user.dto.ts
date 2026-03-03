import { IsString, IsEmail, IsOptional, MinLength, IsIn, IsEnum } from 'class-validator';
import { UserRole } from '../../models/user.schema';
import { GeneratorType } from '../../models/generator.schema';
import { IsObject } from 'class-validator';
import { ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { Matches } from 'class-validator';
import { ValidateIf } from 'class-validator';

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

export class CreateUserDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/[0-9]/, { message: 'Password must contain at least one number' })
  @Matches(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
  @Matches(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
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

}