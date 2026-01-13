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
} from 'class-validator';
import { Type } from 'class-transformer';
class CoordinatesDto {
  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;
}



export class CreateOrderDto {
  @IsString()
  materialType: string;

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

  @IsOptional()
  @IsString()
  notes?: string;
}

