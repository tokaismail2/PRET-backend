import {
  IsNumber,
  IsString,
} from 'class-validator';


export class CreateMaterialDto {
  @IsString()
  name: string;

  @IsNumber()
  price: number;
}


