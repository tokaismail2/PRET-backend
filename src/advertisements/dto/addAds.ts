import { IsArray, IsOptional, IsString } from 'class-validator';

export class AddAdsDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  image: string[];

  @IsString()
  title: string;

  @IsString()
  description: string;
}