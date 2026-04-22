import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument, UserRole } from '../models/user.schema';
import { Generator, GeneratorDocument } from '../models/generator.schema';
import { Factory, FactoryDocument } from '../models/factory.schema';
import { Driver, DriverDocument } from '../models/driver.schema';
import { UpdateLocationDto } from '../auth/dto/update-location.dto';
import { ImageKitService } from '../imagekit/imagekit.service';
import * as bcrypt from 'bcrypt';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersProblems, UsersProblemsDocument } from '../models/usersProblems.schema';
import { RequestProblemDto } from './dto/request-problem.dto';
import { UserWallet, UserWalletDocument } from '../models/userWallet.schema';
import { WalletTransaction, WalletTransactionDocument } from '../models/walletTransactions.schema';


@Injectable()
export class PersonalInformationService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Generator.name) private generatorModel: Model<GeneratorDocument>,
    @InjectModel(Factory.name) private factoryModel: Model<FactoryDocument>,
    @InjectModel(Driver.name) private driverModel: Model<DriverDocument>,
    @InjectModel(UsersProblems.name) private usersProblemsModel: Model<UsersProblemsDocument>,
    @InjectModel(UserWallet.name) private userWalletModel: Model<UserWalletDocument>,
    @InjectModel(WalletTransaction.name) private walletTransactionsModel: Model<WalletTransactionDocument>,
    private imageKitService: ImageKitService,
  ) { }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<Omit<User, 'password'>> {
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Incorrect current password');
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    user.password = hashedPassword;
    await user.save();

    const { password, ...userWithoutPassword } = user.toObject();
    return userWithoutPassword;
  }

  async updateProfilePicture(
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

    // Upload new profile picture to ImageKit
    const uploadResult = await this.imageKitService.uploadFile(
      file,
      'profile-pictures',
      `user-${userId}-${Date.now()}`,
    );

    // Update user profile picture
    user.profilePicture = uploadResult.url;
    await user.save();

    const { password, ...userWithoutPassword } = user.toObject() as any;
    return {
      ...userWithoutPassword,
      profilePicture: uploadResult.url,
    };
  }
  async getProfile(userId: string): Promise<Omit<User, 'password'>> {
    const user = await this.userModel.findById(userId).select('name email profilePicture role phone').lean();
    if (!user) {
      throw new BadRequestException('User not found');
    }
    let profile = '' as any;
    if (user.role === UserRole.GENERATOR) {
      profile = await this.generatorModel.findOne({ user: userId as any }).select('address latitude longitude businessName generatorType ').lean();
    } else if (user.role === UserRole.FACTORY) {
      profile = await this.factoryModel.findOne({ user: userId as any }).select('address latitude longitude').lean();
    } else if (user.role === UserRole.DRIVER) {
      profile = await this.driverModel.findOne({ user: userId as any }).select('address latitude longitude').lean();
    }
    const { password, ...userWithoutPassword } = user as any;
    return {
      ...userWithoutPassword,
      profile,
    };
  }
  async updateProfile(
    userId: string,
    updateProfileDto: UpdateProfileDto,
  ): Promise<Omit<User, 'password'>> {
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    // ── Email uniqueness check ───────────────────────────────────────────────
    if (updateProfileDto.email) {
      const userByEmail = await this.userModel.findOne({ email: updateProfileDto.email });
      if (userByEmail && userByEmail._id.toString() !== userId) {
        throw new BadRequestException('Email already exists');
      }
    }

    // ── Phone uniqueness check ───────────────────────────────────────────────
    if (updateProfileDto.phone) {
      const userByPhone = await this.userModel.findOne({ phone: updateProfileDto.phone });
      if (userByPhone && userByPhone._id.toString() !== userId) {
        throw new BadRequestException('Phone number already exists');
      }
    }

    // ── Update base User fields ──────────────────────────────────────────────
    if (updateProfileDto.name) user.name = updateProfileDto.name;
    if (updateProfileDto.email) user.email = updateProfileDto.email;
    if (updateProfileDto.phone) user.phone = updateProfileDto.phone;

    await user.save();


    if (updateProfileDto.profile) {

      JSON.parse(JSON.stringify(updateProfileDto.profile))
      switch (user.role) {
        case UserRole.DRIVER:
          await this.driverModel.findOneAndUpdate(
            { user: userId } as any,
            { $set: { ...updateProfileDto.profile } },
            { new: true, upsert: true },
          );
          break;

        case UserRole.FACTORY:
          await this.factoryModel.findOneAndUpdate(
            { user: userId } as any,
            { $set: { ...updateProfileDto.profile } },
            { new: true, upsert: true },
          );
          break;

        case UserRole.GENERATOR:
          await this.generatorModel.findOneAndUpdate(
            { user: userId } as any,
            { $set: { ...updateProfileDto.profile } },
            { new: true, upsert: true },
          );
          break;
      }
    }
    const { password, ...userWithoutPassword } = user.toObject() as any;
    return { ...userWithoutPassword };
  }

  async deleteProfilePicture(
    userId: string,
  ): Promise<Omit<User, 'password'>> {
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    user.profilePicture = null;
    await user.save();

    const { password, ...userWithoutPassword } = user.toObject() as any;
    return {
      ...userWithoutPassword,
    };
  }

  async requestProblem(
    userId: string,
    requestProblemDto: RequestProblemDto,
  ): Promise<Omit<User, 'password'>> {
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    const usersProblems = await this.usersProblemsModel.create({
      userId: user._id,
      problem: requestProblemDto.problem,
    });

    const { password, ...userWithoutPassword } = user.toObject() as any;
    return {
      ...userWithoutPassword,
      usersProblems,
    };
  }

  //make it with pagination
  async getProblem(page: number = 1, limit: number = 10): Promise<any> {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.usersProblemsModel.find()
        .populate('userId', 'name email phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.usersProblemsModel.countDocuments(),
    ]);
    const totalPages = Math.ceil(total / limit);

    return {
      message: 'Problems fetched successfully',
      data: {
        problems: data,
        pagination: { total, page, limit, totalPages },
      },
    };
  }
  //make it with pagination
  async getMyWallet(userId: string, page: number = 1, limit: number = 10): Promise<any> {
    const skip = (page - 1) * limit;
    const wallet = await this.userWalletModel.findOne({ userId: userId }).select('balance')
      .lean();
    if (!wallet) {
      throw new BadRequestException('Wallet not found');
    }

    const walletTransactions = await this.walletTransactionsModel
      .find({ walletId: wallet._id })
      .skip(skip)
      .limit(limit)
      .populate({
        path: 'orderId',
        select: 'photos quantity unit price totalPrice createdAt materialTypeId',  // include both fields
        populate: {
          path: 'materialTypeId',         // nested populate still works
        }
      })
      .sort({ createdAt: -1 })
      .lean();

    const total = await this.walletTransactionsModel.countDocuments({ walletId: wallet._id });
    const totalPages = Math.ceil(total / limit);


    return {
      message: 'walletTransactions retrieved successfully',
      data: {
        wallet,
        walletTransactions: await Promise.all(walletTransactions),
        pagination: { total, page, limit, totalPages },
      },
    };
  }



  async updateLocation(
    userId: string,
    updateLocationDto: UpdateLocationDto,
  ): Promise<any> {
    const user = await this.userModel.findById(userId).select('role name email phone').lean();

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.isActive === false) {
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
      ).lean();
    } else if (user.role === UserRole.FACTORY) {
      await this.factoryModel.findOneAndUpdate(
        { user: userId as any },
        {
          $set: {
            'address.coordinates.latitude': updateLocationDto.latitude,
            'address.coordinates.longitude': updateLocationDto.longitude
          }
        }
      ).lean();
    } else if (user.role === UserRole.DRIVER) {
      await this.driverModel.findOneAndUpdate(
        { user: userId as any },
        {
          $set: {
            latitude: updateLocationDto.latitude,
            longitude: updateLocationDto.longitude
          }
        }
      ).lean();
    }

    const { password, ...userWithoutPassword } = user;
    return {
      ...userWithoutPassword,
      latitude: updateLocationDto.latitude,
      longitude: updateLocationDto.longitude
    };
  }

}

