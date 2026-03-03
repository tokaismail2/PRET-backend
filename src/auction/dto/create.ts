import { IsNumber, IsString, IsDate } from 'class-validator';
import { Types } from 'mongoose';


export class CreateAuctionDto {

  @IsString()
  waste_id: Types.ObjectId;

  @IsString()
  warehouse_id: Types.ObjectId;

  @IsString()
  image: string;

  @IsNumber()
  start_price: number;

  
  @IsNumber()
  current_price: number;

  @IsDate()
  ends_at: Date;

  @IsDate()
  starts_at: Date;


}
