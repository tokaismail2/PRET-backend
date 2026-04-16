import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument, UserRole } from '../models/user.schema';
import { Generator, GeneratorDocument } from '../models/generator.schema';
import { Factory, FactoryDocument } from '../models/factory.schema';
import { Driver, DriverDocument } from '../models/driver.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Request } from 'express';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Generator.name) private generatorModel: Model<GeneratorDocument>,
    @InjectModel(Factory.name) private factoryModel: Model<FactoryDocument>,
    @InjectModel(Driver.name) private driverModel: Model<DriverDocument>,
  ) { }

  // ---------------- CREATE ----------------
  async createUser(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.userModel.findOne({ email: createUserDto.email });
    if (existingUser) throw new BadRequestException('Email already exists');

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = new this.userModel({
      ...createUserDto,
      password: hashedPassword,
      isActive: true,
      isVerified: true,
      role: createUserDto.role ?? UserRole.GENERATOR

    });

    await user.save();

    // Prepare address object for profiles
    const address = createUserDto.address
      ? {
        street: createUserDto.address.street,
        city: createUserDto.address.city,
        state: createUserDto.address.state,
        zipCode: createUserDto.address.zipCode,
        country: createUserDto.address.country,
        coordinates: createUserDto.address.coordinates,
      }
      : undefined;

    //create profile 
    if (createUserDto.role === UserRole.GENERATOR) {
      if (!createUserDto.businessName || !createUserDto.generatorType) {
        throw new BadRequestException(
          'businessName and generatorType are required for generators',
        );
      }
      const generator = new this.generatorModel({
        user: user._id,
        businessName: createUserDto.businessName,
        generatorType: createUserDto.generatorType,
        address,
      });
      await generator.save();
    } else if (createUserDto.role === UserRole.FACTORY) {
      const factory = new this.factoryModel({
        user: user._id,
        address,
      });
      await factory.save();
    } else if (createUserDto.role === UserRole.DRIVER) {
      const driverData: any = {
        user: user._id,
        address,
      };

      if (createUserDto.address?.coordinates) {
        driverData.latitude = createUserDto.address.coordinates.latitude;
        driverData.longitude = createUserDto.address.coordinates.longitude;
      }

      const driver = new this.driverModel(driverData);
      await driver.save();
    }

    return user;
  }
 
  //make it with pagination
  async getAllUsers(req: Request, page: number = 1, limit: number = 10): Promise<User[]> {
    const skip = (page - 1) * limit;
    let filter: any = {
      role: {
        $ne: UserRole.ADMIN,
      },
    };

    //role = req.query.role
    if (req.query.role) {
      filter.role = req.query.role;
    }

    const users = await this.userModel.find(filter).select('-password').skip(skip).limit(limit).lean(); // exclude password
    const usersWithProfile = users.map(async user => {
      let profile = null;

      if (user.role === UserRole.GENERATOR) {
        profile = await this.generatorModel.findOne({ user: user._id as any });
      } else if (user.role === UserRole.FACTORY) {
        profile = await this.factoryModel.findOne({ user: user._id as any });
      } else if (user.role === UserRole.DRIVER) {
        profile = await this.driverModel.findOne({ user: user._id as any });
      }

      return {
        ...user,
        profile: profile ? profile.toObject() : null
      };
    });
    return Promise.all(usersWithProfile);
  }

  // ---------------- READ BY ID ----------------
  async getUserById(userId: string): Promise<any> {
    const user = await this.userModel.findById(userId).select('-password');
    if (!user) throw new NotFoundException('User not found');

    let roleData = null;

    if (user.role === UserRole.GENERATOR) {
      roleData = await this.generatorModel.findOne({ user: userId as any });
    } else if (user.role === UserRole.FACTORY) {
      roleData = await this.factoryModel.findOne({ user: userId as any });
    } else if (user.role === UserRole.DRIVER) {
      roleData = await this.driverModel.findOne({ user: userId as any });
    }

    return {
      ...user,
      roleData: roleData ? roleData.toObject() : null
    };
  }

  // ---------------- UPDATE ----------------
  async updateUser(userId: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    // If password is being updated, hash it
    const updateData: any = { ...updateUserDto };

    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    // Update User model fields
    Object.assign(user, updateData);
    await user.save();

    // Prepare address object for profiles if updated
    const profileUpdate: any = {};
    if (updateUserDto.address) {
      profileUpdate.address = {
        street: updateUserDto.address.street,
        city: updateUserDto.address.city,
        state: updateUserDto.address.state,
        zipCode: updateUserDto.address.zipCode,
        country: updateUserDto.address.country,
        coordinates: updateUserDto.address.coordinates,
      };
    }

    if (updateUserDto.businessName) profileUpdate.businessName = updateUserDto.businessName;
    if (updateUserDto.generatorType) profileUpdate.generatorType = updateUserDto.generatorType;

    // Update profile based on role
    if (Object.keys(profileUpdate).length > 0) {
      if (user.role === UserRole.GENERATOR) {
        await this.generatorModel.findOneAndUpdate({ user: user._id as any }, profileUpdate);
      } else if (user.role === UserRole.FACTORY) {
        await this.factoryModel.findOneAndUpdate({ user: user._id as any }, profileUpdate);
      } else if (user.role === UserRole.DRIVER) {
        // Driver specific: map coordinates to top level if provided
        if (profileUpdate.address?.coordinates) {
          profileUpdate.latitude = profileUpdate.address.coordinates.latitude;
          profileUpdate.longitude = profileUpdate.address.coordinates.longitude;
        }
        await this.driverModel.findOneAndUpdate({ user: user._id as any }, profileUpdate);
      }
    }

    return user;
  }

  // ---------------- DELETE ----------------
  async deleteUser(userId: string): Promise<void> {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    await user.deleteOne();
  }

  // ---------------- AUTH HELPERS ----------------
  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userModel.findOne({ email });
    if (!user) return null;

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return null;

    return user;
  }
}
