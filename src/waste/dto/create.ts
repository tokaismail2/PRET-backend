import { IsNumber, IsString, IsOptional } from 'class-validator';

export class CreateWasteDto {
  @IsString()
  warehouse_id: string;


  @IsString()
  material_id: string;


  @IsNumber()
  total_weight: number;

  
  @IsNumber()
  price: number;



  @IsOptional()
  @IsString()
  description?: string;
}
