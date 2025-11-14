import {
  Injectable,
  ConflictException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User, UserDocument, UserRole } from '../models/user.schema';
import { RegisterDto } from './dto/register.dto';
import { LoginEmailDto } from './dto/login-email.dto';
import { LoginPhoneDto } from './dto/login-phone.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<Omit<User, 'password'>> {
    // Check if user already exists
    const existingUser = await this.userModel.findOne({
      email: registerDto.email,
    });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const role = registerDto.role || UserRole.GENERATOR;

    // Validate generatorType based on role
    if (role === UserRole.GENERATOR && !registerDto.generatorType) {
      throw new BadRequestException(
        'Generator type is required when role is generator',
      );
    }

    if (role === UserRole.FACTORY && registerDto.generatorType) {
      throw new BadRequestException(
        'Generator type should not be provided when role is factory',
      );
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(registerDto.password, saltRounds);

    // Prepare user data
    const userData: any = {
      ...registerDto,
      password: hashedPassword,
      role,
    };

    // Only include generatorType if role is generator
    if (role === UserRole.GENERATOR) {
      userData.generatorType = registerDto.generatorType;
    } else {
      // Explicitly set to undefined to ensure it's not saved
      userData.generatorType = undefined;
    }

    // Create new user
    const newUser = new this.userModel(userData);

    const savedUser = await newUser.save();

    // Return user without password
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = savedUser.toObject();
    return userWithoutPassword;
  }

  async loginWithEmail(loginEmailDto: LoginEmailDto) {
    // Find user by email
    const user = await this.userModel.findOne({
      email: loginEmailDto.email.toLowerCase().trim(),
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      loginEmailDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Generate JWT token
    const payload = { 
      sub: (user._id as any).toString(), 
      email: user.email, 
      role: user.role 
    };
    const accessToken = this.jwtService.sign(payload);

    // Return user without password and token
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user.toObject();
    return {
      user: userWithoutPassword,
      accessToken,
    };
  }

  async loginWithPhone(loginPhoneDto: LoginPhoneDto) {
    // Find user by phone
    const user = await this.userModel.findOne({
      phone: loginPhoneDto.phone.trim(),
    });

    if (!user) {
      throw new UnauthorizedException('Invalid phone number or password');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      loginPhoneDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid phone number or password');
    }

    // Generate JWT token
    const payload = { 
      sub: (user._id as any).toString(), 
      email: user.email, 
      role: user.role 
    };
    const accessToken = this.jwtService.sign(payload);

    // Return user without password and token
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user.toObject();
    return {
      user: userWithoutPassword,
      accessToken,
    };
  }
}
