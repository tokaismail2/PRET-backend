import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Charity, CharitySchema } from '../models/charity.schema';
import { CharityController } from './controller';
import { CharityService } from './service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Charity.name, schema: CharitySchema },
    ]),
  ],
  controllers: [CharityController],
  providers: [CharityService],
})
export class CharityModule {}
