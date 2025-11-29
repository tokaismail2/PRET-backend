import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument, UserRole } from '../models/user.schema';
import { UpdateLocationDto } from '../auth/dto/update-location.dto';
import { ImageKitService } from '../imagekit/imagekit.service';

@Injectable()
export class PersonalInformationService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private imageKitService: ImageKitService,
  ) {}

  async updateLocation(
    userId: string,
    updateLocationDto: UpdateLocationDto,
  ): Promise<Omit<User, 'password'>> {
    // Find user by ID
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    // Update location coordinates
    // Initialize address object if it doesn't exist
    if (!user.address) {
      user.address = {};
    }

    // Update coordinates
    user.address.coordinates = {
      latitude: updateLocationDto.latitude,
      longitude: updateLocationDto.longitude,
    };

    // Save updated user
    const updatedUser = await user.save();

    // Return user without password
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = updatedUser.toObject();
    return userWithoutPassword;
  }

  async uploadLogo(
    userId: string,
    file: any,
  ): Promise<Omit<User, 'password'>> {
    // Find user by ID
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    // Check if user is a generator
    if (user.role !== UserRole.GENERATOR) {
      throw new BadRequestException('Only generators can upload logos');
    }

    // Delete old logo if exists
    if (user.logo) {
      try {
        // Extract file ID from URL if it's an ImageKit URL
        // ImageKit URLs typically contain file IDs in the path
        // For now, we'll just upload the new one and let ImageKit handle cleanup
        // In production, you might want to track file IDs separately
      } catch (error) {
        // Log error but don't fail the upload
        console.warn('Failed to delete old logo:', error);
      }
    }

    // Upload file to ImageKit
    const uploadResult = await this.imageKitService.uploadFile(
      file,
      'generators/logos',
      `generator-${userId}-${Date.now()}`,
    );

    // Update user logo
    user.logo = uploadResult.url;
    const updatedUser = await user.save();

    // Return user without password
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = updatedUser.toObject();
    return userWithoutPassword;
  }
}

