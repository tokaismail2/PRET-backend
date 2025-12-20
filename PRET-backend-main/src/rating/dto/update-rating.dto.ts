import { IsInt, Min, Max, IsOptional, IsString } from 'class-validator';

export class UpdateRatingDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  value?: number;

  @IsOptional()
  @IsString()
  comment?: string;
}
