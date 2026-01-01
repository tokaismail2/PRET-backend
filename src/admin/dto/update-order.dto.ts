import {
  IsEnum,
  IsNumber,
  IsString,
  IsOptional,
  Min,
} from 'class-validator';
import { MaterialType, OrderStatus } from '../../models/order.schema';

export class UpdateOrderDto {
  @IsOptional()
  @IsEnum(MaterialType)
  materialType?: MaterialType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  quantity?: number; // in liters

  @IsOptional()
  @IsString()
  unit?: string; // 'L', 'kg', etc.

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number; // price per unit in EGP

  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}
