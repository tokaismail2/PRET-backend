import {
  IsNumber,
  IsString,
  IsOptional,
  Min,
  IsArray,
  ArrayMaxSize,
} from 'class-validator';



export class CreateDonationDto {
  @IsNumber()
  @Min(1)
  mealsProvided: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(5, {
    message: 'Maximum 5 images allowed',
  })
  images?: string[]; // URLs to meal images (up to 3)


  @IsOptional()
  @IsString()
  notes?: string;

  
}

