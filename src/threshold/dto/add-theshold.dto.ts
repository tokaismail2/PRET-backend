import {
  IsNumber,
  IsString,
} from 'class-validator';


export class CreateThresholdDto {
  @IsString()
  material_name: string;

  @IsNumber()
  target_weight: number;
}


