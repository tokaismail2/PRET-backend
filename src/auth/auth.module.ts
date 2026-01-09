import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { User, UserSchema } from '../models/user.schema';
import { Generator, GeneratorSchema } from '../models/generator.schema';
import { Factory, FactorySchema } from '../models/factory.schema';
import { Driver, DriverSchema } from '../models/driver.schema';
import { JwtStrategy } from './strategies/jwt.strategy';
import { FirebaseService } from '../firebase/firebase.service';
import { EmailService } from '../email/email.service';
import { EmailModule } from '../email/email.module';
import { FirebaseModule } from '../firebase/firebase.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Generator.name, schema: GeneratorSchema },
      { name: Factory.name, schema: FactorySchema },
      { name: Driver.name, schema: DriverSchema },
    ]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'your-secret-key-change-in-production',
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),
    FirebaseModule,
    EmailModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, FirebaseService],
  exports: [AuthService],
})
export class AuthModule { }
