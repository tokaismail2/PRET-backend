import { IsMongoId, IsNumber } from 'class-validator';

export class CreatePaymentDto {
  @IsMongoId()
  orderId: string;

  @IsNumber()
  amount: number;
}
