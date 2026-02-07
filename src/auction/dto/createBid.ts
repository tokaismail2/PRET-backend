import { IsNumber, IsString } from 'class-validator';


export class CreateBidDto {

  @IsNumber()
  total_price: number;

  @IsString()
  factory_id: string;


}
