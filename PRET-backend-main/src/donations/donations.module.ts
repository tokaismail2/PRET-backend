import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DonationsController } from './donations.controller';
import { DonationsService } from './donations.service';
import { Donation, DonationSchema } from '../models/donation.schema';
import { User, UserSchema } from '../models/user.schema';
import { ImageKitModule } from '../imagekit/imagekit.module';

@Module({
  imports: [
    MongooseModule.forFeature([
  { name: 'Donation', schema: DonationSchema },
  { name: 'User', schema: UserSchema },
]),

    ImageKitModule,
  ],
  controllers: [DonationsController],
  providers: [DonationsService],
  exports: [DonationsService],
})
export class DonationsModule {}
