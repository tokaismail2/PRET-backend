
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Driver, DriverDocument } from '../../models/driver.schema';

@Injectable()
export class DriverJwtStrategy extends PassportStrategy(
  Strategy,
  'driver-jwt',
) {
  constructor(
    @InjectModel(Driver.name)
    private driverModel: Model<DriverDocument>,
    private configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get('DRIVER_JWT_SECRET') || 'your-driver-secret-key-change-in-production',
    });
  }

  async validate(payload: any) {
    const driver = await this.driverModel.findById(payload.sub);

    if (!driver || !driver.isActive) {
      throw new UnauthorizedException('Driver not found or inactive');
    }

    return {
      driverId: driver._id,
    };
  }
}



