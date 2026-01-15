// waste.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Waste, WasteSchema } from '../models/waste.schema';
import { WasteService } from './wasteService';
import { WasteController } from './wasteController';

@Module({
  imports: [MongooseModule.forFeature([{ name: Waste.name, schema: WasteSchema }])],
  providers: [WasteService],
  controllers: [WasteController],
})
export class WasteModule {}
