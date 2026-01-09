import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersController } from './user.controller';
import { UsersService } from './user.sevice';
import { User, UserSchema } from '../models/user.schema';
import { Generator, GeneratorSchema } from '../models/generator.schema';
import { Factory, FactorySchema } from '../models/factory.schema';
import { Driver, DriverSchema } from '../models/driver.schema';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Generator.name, schema: GeneratorSchema },
      { name: Factory.name, schema: FactorySchema },
      { name: Driver.name, schema: DriverSchema },
    ]),
    JwtModule.register({}),
    AuthModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule { }
