import { IsString } from 'class-validator';


export class CreateCharityDto {

  @IsString()
  name: string;


  @IsString()
  phone: string;

  
  @IsString()
  address: string;



}
