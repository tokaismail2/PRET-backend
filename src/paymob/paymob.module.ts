import { Module } from '@nestjs/common';
import { PaymobService } from './paymob.service';
import { PaymobController } from './paymob.controller';

@Module({
  providers: [PaymobService],
  controllers: [PaymobController],
  exports: [PaymobService],
})
export class PaymobModule {}
