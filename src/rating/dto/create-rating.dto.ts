// create-rating.dto.ts
import { IsInt, Min, Max, IsString, IsOptional, IsMongoId, IsEnum } from 'class-validator';

export class CreateRatingDto {
  @IsMongoId()
  targetId: string;

  @IsEnum(['order', 'donation'])
  targetType: string;

  @IsInt()
  @Min(1)
  @Max(5)
  value: number;

  @IsOptional()
  @IsString()
  comment?: string;
}

