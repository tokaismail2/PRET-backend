import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuditLog, AuditLogSchema } from '../models/auditLog.schema';
import { ImageKitModule } from '../imagekit/imagekit.module';
import { Advertisement, AdvertisementSchema } from '../models/advertisement.schema';
import { AdsController } from './ads.controller';
import { AdsService } from './ads.services';
import { PassportModule } from '@nestjs/passport';


@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Advertisement.name, schema: AdvertisementSchema },
      { name: AuditLog.name, schema: AuditLogSchema },
    ]),

    PassportModule.register({ defaultStrategy: 'jwt' }),
    ImageKitModule,
  ],
  controllers: [AdsController],
  providers: [AdsService],
  exports: [AdsService],
})
export class AdsModule { }
