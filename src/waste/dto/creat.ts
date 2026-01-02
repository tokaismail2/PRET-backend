import { IsEnum, IsNumber, IsString, IsOptional } from 'class-validator';
import { WasteType } from '../../models/waste.schema';

export class CreateWasteDto {
  @IsEnum(WasteType)
  type: WasteType;

  @IsNumber()
  quantity: number;

  @IsString()
  restaurant: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
