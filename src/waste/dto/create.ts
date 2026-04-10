import { IsNumber, IsString, IsOptional, IsMongoId } from 'class-validator';

export class CreateWasteDto {
  @IsMongoId()
  warehouse_id: string;

  @IsMongoId()
  material_id: string;

  @IsNumber()
  total_weight: number;

  @IsNumber()
  price: number;

  @IsOptional()
  @IsString()
  description?: string;
}