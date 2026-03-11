import { IsNumber, IsString, IsOptional } from 'class-validator';
import { Types } from 'mongoose';
import { Transform } from 'class-transformer';
import { IsMongoId } from 'class-validator';

export class CreateWasteDto {
  @IsMongoId()
  @Transform(({ value }) => new Types.ObjectId(value))
  warehouse_id: Types.ObjectId;

  @IsMongoId()
  @Transform(({ value }) => new Types.ObjectId(value))
  material_id: Types.ObjectId;


  @IsNumber()
  total_weight: number;


  @IsNumber()
  price: number;



  @IsOptional()
  @IsString()
  description?: string;

}
