import { IsNumber, IsString, IsDate, IsMongoId } from 'class-validator';
import { Types } from 'mongoose';
import { Transform } from 'class-transformer';


export class CreateAuctionDto {

  @IsMongoId()
  @Transform(({ value }) => new Types.ObjectId(value))
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
