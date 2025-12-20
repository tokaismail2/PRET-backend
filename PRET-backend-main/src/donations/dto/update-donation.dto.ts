import { IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateDonationDto } from './create-donation.dto';

export class UpdateDonationDto {
  @IsOptional()
  @IsNumber()
  mealsProvided?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => Object)
  pickupLocation?: Partial<CreateDonationDto['pickupLocation']>;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  photos?: string[];
}
