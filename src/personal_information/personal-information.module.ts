import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PersonalInformationController } from './personal-information.controller';
import { PersonalInformationService } from './personal-information.service';
import { User, UserSchema } from '../models/user.schema';
import { Generator, GeneratorSchema } from '../models/generator.schema';
import { Factory, FactorySchema } from '../models/factory.schema';
import { Driver, DriverSchema } from '../models/driver.schema';
import { ImageKitModule } from '../imagekit/imagekit.module';
import { AuditLog, AuditLogSchema } from '../models/auditLog.schema';
import { UsersProblems, UsersProblemsSchema } from '../models/usersProblems.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Generator.name, schema: GeneratorSchema },
      { name: Factory.name, schema: FactorySchema },
      { name: Driver.name, schema: DriverSchema },
      { name: AuditLog.name, schema: AuditLogSchema },
      { name: UsersProblems.name, schema: UsersProblemsSchema },
    ]),
    ImageKitModule,
  ],
  controllers: [PersonalInformationController],
  providers: [PersonalInformationService],
  exports: [PersonalInformationService],
})
export class PersonalInformationModule { }

