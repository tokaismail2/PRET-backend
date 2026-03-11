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
  IsMongoId,
} from 'class-validator';
import { Types } from 'mongoose';
import { Transform } from 'class-transformer';
class CoordinatesDto {
  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;
}



export class CreateOrderDto {

  @IsMongoId()
  @Transform(({ value }) => new Types.ObjectId(value))
  materialType: Types.ObjectId;

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
  @ArrayMaxSize(5, {
    message: 'Maximum 5 photos allowed',
  })
  photos?: string[]; // URLs to photos (up to 5)

  @IsOptional()
  @IsString()
  notes?: string;
}

