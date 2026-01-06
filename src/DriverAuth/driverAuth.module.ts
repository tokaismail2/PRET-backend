import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './driverAuth.controller';
import { AuthService } from './driverAuth.service';
import { Driver, DriverSchema } from '../models/driver.schema';
import { DriverJwtStrategy } from './strategies/jwtForDriver.strategy';
import { FirebaseModule } from '../firebase/firebase.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Driver.name, schema: DriverSchema }]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('DRIVER_JWT_SECRET') || 'your-driver-secret-key-change-in-production',
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),
    FirebaseModule,
    EmailModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, DriverJwtStrategy],
  exports: [AuthService],
})
export class DriverAuthModule { }
