import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DonationsController } from './donations.controller';
import { DonationsService } from './donations.service';
import { Donation, DonationSchema } from '../models/donation.schema';
import { User, UserSchema } from '../models/user.schema';
import { ImageKitModule } from '../imagekit/imagekit.module';
import { AuditLog, AuditLogSchema } from '../models/auditLog.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Donation.name, schema: DonationSchema },
      { name: User.name, schema: UserSchema },
      { name: AuditLog.name, schema: AuditLogSchema },
    ]),
    ImageKitModule,
  ],
  controllers: [DonationsController],
  providers: [DonationsService],
  exports: [DonationsService],
})
export class DonationsModule {}

