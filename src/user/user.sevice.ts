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
      isActive: true, // default active
      role: createUserDto.role ?? UserRole.GENERATOR

    });

    return user.save();
  }

  // ---------------- READ ALL ----------------
  async getAllUsers(): Promise<User[]> {
    return this.userModel.find().select('-password').exec(); // exclude password
  }

  // ---------------- READ BY ID ----------------
  async getUserById(userId: string): Promise<any> {
    const user = await this.userModel.findById(userId).select('-password');
    if (!user) throw new NotFoundException('User not found');

    const userObj = user.toObject();
    let roleData = null;

    if (user.role === UserRole.GENERATOR) {
      roleData = await this.generatorModel.findOne({ user: userId });
    } else if (user.role === UserRole.FACTORY) {
      roleData = await this.factoryModel.findOne({ user: userId });
    } else if (user.role === UserRole.DRIVER) {
      roleData = await this.driverModel.findOne({ user: userId });
    }

    return {
      ...userObj,
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

    Object.assign(user, updateData);
    return user.save();

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
