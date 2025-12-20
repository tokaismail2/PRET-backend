import {
  IsEnum,
  IsNumber,
  IsString,
  IsOptional,
  IsObject,
  Min,
  ValidateNested,
  IsArray,
  Max,
  ArrayMaxSize,
} 

from 'class-validator';
import { Type } from 'class-transformer';
import { MaterialType } from '../../models/order.schema';

class CoordinatesDto {
  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;
}

class PickupLocationDto {
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
  @ValidateNested()
  @Type(() => CoordinatesDto)
  coordinates?: CoordinatesDto;
}

export class CreateOrderDto {
  @IsEnum(MaterialType)
  materialType: MaterialType;

  @IsNumber()
  @Min(0)
  quantity: number; // in liters

  @IsString()
  unit: string; // 'L', 'kg', etc.

  @IsNumber()
  @Min(0)
  price: number; // price per unit in EGP

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(3, {
    message: 'Maximum 3 photos allowed',
  })
  photos?: string[]; // URLs to photos (up to 3)

  @IsObject()
  @ValidateNested()
  @Type(() => PickupLocationDto)
  pickupLocation: PickupLocationDto;

  @IsOptional()
  @IsString()
  notes?: string;
}

