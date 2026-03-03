import { IsNumber, IsString, IsDate } from 'class-validator';
import { Types } from 'mongoose';


export class CreateAuctionDto {

  waste_id: Types.ObjectId;


  @IsNumber()
  start_price: number;

  
  @IsNumber()
  current_price: number;

  @IsDate()
  ends_at: Date;

  @IsDate()
  starts_at: Date;


}
