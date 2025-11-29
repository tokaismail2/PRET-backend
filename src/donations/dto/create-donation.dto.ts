import {
  IsNumber,
  IsString,
  IsOptional,
  IsObject,
  Min,
  ValidateNested,
  IsArray,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';

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

export class CreateDonationDto {
  @IsNumber()
  @Min(1)
  mealsProvided: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(3, {
    message: 'Maximum 3 photos allowed',
  })
  photos?: string[]; // URLs to meal photos (up to 3)

  @IsObject()
  @ValidateNested()
  @Type(() => PickupLocationDto)
  pickupLocation: PickupLocationDto;

  @IsOptional()
  @IsString()
  notes?: string;
}

