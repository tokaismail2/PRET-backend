import { IsNumber, IsString, IsDate } from 'class-validator';


export class CreateAuctionDto {
  @IsString()
  warehouse_id: string;


  @IsString()
  waste_id: string;


  @IsNumber()
  start_price: number;

  
  @IsNumber()
  current_price: number;

  @IsDate()
  ends_at: Date;

  @IsDate()
  starts_at: Date;


}
