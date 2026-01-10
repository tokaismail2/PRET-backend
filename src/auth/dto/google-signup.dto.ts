import { IsString, IsOptional, IsEnum, IsObject, ValidateNested, IsIn } from 'class-validator';
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

export class GoogleSignupDto {
  @IsString()
  idToken: string;

  @IsOptional()
  @IsIn(['generator', 'factory', 'driver'], {
    message: 'invailed role',
  })
  role?: 'generator' | 'factory' | 'driver';

  @IsOptional()
  @IsEnum(GeneratorType, {
    message:
      'Generator type must be one of: hotel, restaurant, cafe, office, residential, warehouse, other',
  })
  generatorType?: GeneratorType;

  @IsOptional()
  @IsString()
  businessName?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto;
}

