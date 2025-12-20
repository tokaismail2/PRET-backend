import { IsInt, Min, Max, IsString, IsOptional } from 'class-validator';

export class CreateRatingDto {
  @IsString()
  targetId: string; // orderId أو donationId

  @IsInt()
  @Min(1)
  @Max(5)
  value: number;

  @IsOptional()
  @IsString()
  comment?: string;
}
