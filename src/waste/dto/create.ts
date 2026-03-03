import { IsNumber, IsString, IsOptional, IsMongoId } from 'class-validator';
import { Types } from 'mongoose';

export class CreateWasteDto {
  @IsMongoId()
  warehouse_id: Types.ObjectId;


  @IsMongoId()
  material_id: Types.ObjectId;


  @IsNumber()
  total_weight: number;


  @IsNumber()
  price: number;



  @IsOptional()
  @IsString()
  description?: string;

}
