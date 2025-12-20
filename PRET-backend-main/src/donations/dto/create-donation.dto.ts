import { IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class LocationDto {
  @IsOptional() street?: string;
  @IsOptional() city?: string;
  @IsOptional() state?: string;
  @IsOptional() zipCode?: string;
  @IsOptional() country?: string;
  @IsOptional() latitude?: number;
  @IsOptional() longitude?: number;
}

export class CreateDonationDto {
  @IsNumber()
  mealsProvided: number;

  @ValidateNested()
  @Type(() => LocationDto)
  pickupLocation: LocationDto;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  photos?: string[];
}
