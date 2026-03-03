import { IsNumber, IsString, IsOptional } from 'class-validator';
import { Types } from 'mongoose';

export class CreateWasteDto {

  warehouse_id: Types.ObjectId;



  material_id: Types.ObjectId;


  @IsNumber()
  total_weight: number;


  @IsNumber()
  price: number;



  @IsOptional()
  @IsString()
  description?: string;

}
