import { IsNumber, IsString, IsOptional } from 'class-validator';
import { Types } from 'mongoose';

export class CreateWasteDto {
  @IsString()
  warehouse_id: Types.ObjectId;


  @IsString()
  material_id: Types.ObjectId;


  @IsNumber()
  total_weight: number;


  @IsNumber()
  price: number;



  @IsOptional()
  @IsString()
  description?: string;

}
