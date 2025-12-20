import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PersonalInformationController } from './personal-information.controller';
import { PersonalInformationService } from './personal-information.service';
import { User, UserSchema } from '../models/user.schema';
import { ImageKitModule } from '../imagekit/imagekit.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    ImageKitModule,
  ],
  controllers: [PersonalInformationController],
  providers: [PersonalInformationService],
  exports: [PersonalInformationService],
})
export class PersonalInformationModule {}

