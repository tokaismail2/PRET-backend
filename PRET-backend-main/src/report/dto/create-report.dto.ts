import { IsString, IsOptional } from 'class-validator';

export class CreateReportDto {
  @IsString()
  targetId: string;

  @IsString()
  targetType: string;

  @IsString()
  reason: string;

  @IsOptional()
  @IsString()
  description?: string;
}
