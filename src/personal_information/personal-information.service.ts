import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument, UserRole } from '../models/user.schema';
import { Generator, GeneratorDocument } from '../models/generator.schema';
import { Factory, FactoryDocument } from '../models/factory.schema';
import { Driver, DriverDocument } from '../models/driver.schema';
import { UpdateLocationDto } from '../auth/dto/update-location.dto';
import { ImageKitService } from '../imagekit/imagekit.service';

@Injectable()
export class PersonalInformationService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Generator.name) private generatorModel: Model<GeneratorDocument>,
    @InjectModel(Factory.name) private factoryModel: Model<FactoryDocument>,
    @InjectModel(Driver.name) private driverModel: Model<DriverDocument>,
    private imageKitService: ImageKitService,
  ) { }

  async updateLocation(
    userId: string,
    updateLocationDto: UpdateLocationDto,
  ): Promise<Omit<User, 'password'>> {
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    // Update role-specific records
    if (user.role === UserRole.GENERATOR) {
      await this.generatorModel.findOneAndUpdate(
        { user: userId as any },
        {
          $set: {
            'address.coordinates.latitude': updateLocationDto.latitude,
            'address.coordinates.longitude': updateLocationDto.longitude
          }
        }
      );
    } else if (user.role === UserRole.FACTORY) {
      await this.factoryModel.findOneAndUpdate(
        { user: userId as any },
        {
          $set: {
            'address.coordinates.latitude': updateLocationDto.latitude,
            'address.coordinates.longitude': updateLocationDto.longitude
          }
        }
      );
    } else if (user.role === UserRole.DRIVER) {
      await this.driverModel.findOneAndUpdate(
        { user: userId as any },
        {
          $set: {
            latitude: updateLocationDto.latitude,
            longitude: updateLocationDto.longitude
          }
        }
      );
    }

    const { password, ...userWithoutPassword } = user.toObject();
    return userWithoutPassword;
  }

  async uploadLogo(
    userId: string,
    file: any,
  ): Promise<Omit<User, 'password'>> {
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    if (user.role !== UserRole.GENERATOR) {
      throw new BadRequestException('Only generators can upload logos');
    }

    // Find generator record to check for old logo and update
    const generator = await this.generatorModel.findOne({ user: userId as any });
    if (!generator) {
      throw new BadRequestException('Generator data not found');
    }

    // Delete old logo if exists
    if (generator.logo) {
      try {
        // ... cleanup logic if any ...
      } catch (error) {
        console.warn('Failed to delete old logo:', error);
      }
    }

    // Upload file to ImageKit
    const uploadResult = await this.imageKitService.uploadFile(
      file,
      'generators/logos',
      `generator-${userId}-${Date.now()}`,
    );

    // Update generator logo
    generator.logo = uploadResult.url;
    await generator.save();

    const { password, ...userWithoutPassword } = user.toObject();
    return userWithoutPassword;
  }
}

