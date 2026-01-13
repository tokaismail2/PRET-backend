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
import { Generator, GeneratorDocument, GeneratorType } from '../models/generator.schema';
import { Factory, FactoryDocument } from '../models/factory.schema';
import { Driver, DriverDocument } from '../models/driver.schema';
import { RegisterDto } from './dto/register.dto';
import { LoginEmailDto } from './dto/login-email.dto';
import { LoginPhoneDto } from './dto/login-phone.dto';
import { GoogleSignupDto } from './dto/google-signup.dto';
import { FirebaseService } from '../firebase/firebase.service';
import { EmailService } from '../email/email.service';
import { ForgetPasswordRequestDto } from './dto/forget-password-request.dto';
import { VerifyResetCodeDto } from './dto/verify-reset-code.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { VerifyPhoneDto } from './dto/verify-phone.dto';


interface ResetCodeData {
  code: string;
  expiresAt: Date;
  email: string;
  verified: boolean;
}

interface EmailVerificationCodeData {
  code: string;
  expiresAt: Date;
  email: string;
  verified: boolean;
}

interface PhoneVerificationCodeData {
  code: string;
  expiresAt: Date;
  phone: string;
  verified: boolean;
}

@Injectable()
export class AuthService {
  // In-memory store for reset codes (consider using Redis in production)
  private resetCodes = new Map<string, ResetCodeData>();
  // In-memory store for email verification codes (consider using Redis in production)
  private emailVerificationCodes = new Map<string, EmailVerificationCodeData>();
  // In-memory store for phone verification codes (consider using Redis in production)
  private phoneVerificationCodes = new Map<string, PhoneVerificationCodeData>();

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Generator.name) private generatorModel: Model<GeneratorDocument>,
    @InjectModel(Factory.name) private factoryModel: Model<FactoryDocument>,
    @InjectModel(Driver.name) private driverModel: Model<DriverDocument>,
    private jwtService: JwtService,
    private firebaseService: FirebaseService,
    private emailService: EmailService,
  ) {
    // Clean up expired codes every 5 minutes
    setInterval(() => {
      this.cleanupExpiredCodes();
      this.cleanupExpiredEmailVerificationCodes();
      this.cleanupExpiredPhoneVerificationCodes();
    }, 5 * 60 * 1000);
  }

  async register(registerDto: RegisterDto): Promise<Omit<User, 'password'>> {
    // Check if user already exists by email
    const existingUserByEmail = await this.userModel.findOne({
      email: registerDto.email.toLowerCase().trim(),
      isVerified: true,
    });
    if (existingUserByEmail) {
      throw new ConflictException('User with this email already exists');
    }

    // Check if phone already exists (if provided)
    if (registerDto.phone) {
      const existingUserByPhone = await this.userModel.findOne({
        phone: registerDto.phone.trim(),
        isVerified: true,
      });
      if (existingUserByPhone) {
        throw new ConflictException('User with this phone number already exists');
      }
    }

    const role: UserRole = (registerDto.role as unknown as UserRole) || UserRole.GENERATOR;

    // Ensure role is one of the allowed registration roles
    if (![UserRole.GENERATOR, UserRole.FACTORY, UserRole.DRIVER].includes(role)) {
      throw new BadRequestException('Invalid role. Must be one of: generator, factory, driver');
    }

    // Validate role-specific fields
    this.validateRoleSpecificFields(role, registerDto);

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(registerDto.password, saltRounds);

    // Create User record
    const newUser = new this.userModel({
      email: registerDto.email.toLowerCase().trim(),
      password: hashedPassword,
      name: registerDto.name,
      phone: registerDto.phone?.trim(),
      role,
    });

    const savedUser = await newUser.save();

    // Create role-specific record
    try {
      await this.createRoleSpecificRecord(role, (savedUser._id as any).toString(), registerDto);
    } catch (error) {
      // Rollback user creation if role record fails
      await this.userModel.findByIdAndDelete(savedUser._id);
      throw error;
    }

    // Determine verification method (default to email if not specified)
    const verificationMethod = registerDto.verificationMethod || 'email';

    if (verificationMethod === 'phone') {
      // Phone verification
      if (!savedUser.phone) {
        throw new BadRequestException('Phone number is required for phone verification');
      }
      const verificationCode = '123456'; // Static for now as requested in original code
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 5);

      this.phoneVerificationCodes.set(savedUser.phone.trim(), {
        code: verificationCode,
        expiresAt,
        phone: savedUser.phone.trim(),
        verified: false,
      });
    } else {
      // Email verification
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 5);

      this.emailVerificationCodes.set(savedUser.email.toLowerCase().trim(), {
        code: verificationCode,
        expiresAt,
        email: savedUser.email.toLowerCase().trim(),
        verified: false,
      });

      await this.emailService.sendEmailVerificationCode(savedUser.email, verificationCode);
    }

    // Return user without password
    const userObj = savedUser.toObject();
    delete userObj.password;
    return userObj;
  }

  private validateRoleSpecificFields(role: UserRole, dto: RegisterDto) {
    if (role === UserRole.GENERATOR) {
      if (!dto.generatorType) throw new BadRequestException('Generator type is required');
      if (!dto.businessName) throw new BadRequestException('Business name is required');
      if (!dto.address) throw new BadRequestException('Address is required');
    } else if (role === UserRole.FACTORY) {
      if (!dto.address) throw new BadRequestException('Address is required');
    }
  }

  private async createRoleSpecificRecord(role: UserRole, userId: string, dto: RegisterDto) {
    if (role === UserRole.GENERATOR) {
      const generator = new this.generatorModel({
        user: userId,
        generatorType: dto.generatorType,
        businessName: dto.businessName,
        address: dto.address,
      });
      await generator.save();
    } else if (role === UserRole.FACTORY) {
      const factory = new this.factoryModel({
        user: userId,
        businessName: dto.businessName,
        address: dto.address,
      });
      await factory.save();
    } else if (role === UserRole.DRIVER) {
      const driver = new this.driverModel({
        user: userId,
        latitude: dto.address?.coordinates?.latitude,
        longitude: dto.address?.coordinates?.longitude,
        address: dto.address ? {
          street: dto.address.street,
          city: dto.address.city,
          state: dto.address.state,
          zipCode: dto.address.zipCode,
          country: dto.address.country,
        } : undefined,
      });
      await driver.save();
    }
  }

  async loginWithEmail(loginEmailDto: LoginEmailDto) {
    const user = await this.userModel.findOne({
      email: loginEmailDto.email.toLowerCase().trim(),
      isVerified: true,
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    if (!user.password || user.authProvider === 'google') {
      throw new UnauthorizedException('Please sign in with Google');
    }

    // Verify password
    // const isPasswordValid = await bcrypt.compare(
    //   loginEmailDto.password,
    //   user.password,
    // );

    // if (!isPasswordValid) {
    //   throw new UnauthorizedException('Invalid email or password');
    // }

    // 🔹 load profile based on role
    let profile: any = null;

    switch (user.role) {
      case 'generator':
        profile = await this.generatorModel.findOne({ user: user._id as any });
        break;

      case 'factory':
        profile = await this.factoryModel.findOne({ user: user._id as any });
        break;

      case 'driver':
        profile = await this.driverModel.findOne({ user: user._id as any });
        break;
      case 'admin':
        profile = { type: 'admin' };
        break;

    }

    if (!profile) {
      throw new UnauthorizedException('User profile not found');
    }

    const payload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);

    const { password, ...userWithoutPassword } = user.toObject();

    return {
      success: true,
      message: 'Login successful',
      data: {
        user: userWithoutPassword,
        profile,
        accessToken,
      },
    };
  }


  async loginWithPhone(loginPhoneDto: LoginPhoneDto) {
    // 1️⃣ Find user by phone
    const user = await this.userModel.findOne({
      phone: loginPhoneDto.phone.trim(),
      isVerified: true,
    });

    if (!user) {
      throw new UnauthorizedException('Invalid phone number or password');
    }

    // 2️⃣ Check if user is active
    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    // 3️⃣ Check auth provider
    if (!user.password || user.authProvider === 'google') {
      throw new UnauthorizedException('Please sign in with Google');
    }

    // 4️⃣ Verify password
    const isPasswordValid = await bcrypt.compare(
      loginPhoneDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid phone number or password');
    }

    // 5️⃣ Load profile based on role
    let profile: any;

    switch (user.role) {
      case 'generator':
        profile = await this.generatorModel.findOne({ user: user._id as any });
        break;

      case 'factory':
        profile = await this.factoryModel.findOne({ user: user._id as any });
        break;

      case 'driver':
        profile = await this.driverModel.findOne({ user: user._id as any });
        break;
    }

    if (!profile) {
      throw new UnauthorizedException('User profile not found');
    }

    // 6️⃣ Generate token
    const payload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);

    // 7️⃣ Remove password
    const { password, ...userWithoutPassword } = user.toObject();

    // 8️⃣ Unified response
    return {
      success: true,
      message: 'Login successful',
      data: {
        user: userWithoutPassword,
        profile,
        accessToken,
      },
    };
  }


  async signUpWithGoogle(googleSignupDto: GoogleSignupDto) {
    try {
      // Verify the Firebase ID token
      const decodedToken = await this.firebaseService.verifyIdToken(
        googleSignupDto.idToken,
      );

      // Extract user information from the decoded token
      const email = decodedToken.email;
      const name = decodedToken.name || decodedToken.email?.split('@')[0] || 'User';
      const picture = decodedToken.picture;
      const googleId = decodedToken.uid;

      if (!email) {
        throw new BadRequestException('Email not found in Google account');
      }

      // Check if user already exists by email or googleId
      let user = await this.userModel.findOne({
        $or: [{ email: email.toLowerCase().trim() }, { googleId }],
      });

      if (user) {
        // User exists - update Google info if needed and return login response
        if (!user.googleId) {
          user.googleId = googleId;
          user.authProvider = 'google';
          if (picture && !user.profilePicture) {
            user.profilePicture = picture;
          }
          await user.save();
        }

        // Check if user is active
        if (!user.isActive) {
          throw new UnauthorizedException('Account is inactive');
        }
      } else {
        const role: UserRole = (googleSignupDto.role as unknown as UserRole) || UserRole.GENERATOR;

        // Explicitly prevent admin registration via Google
        if (role === UserRole.ADMIN) {
          throw new BadRequestException('Registration with admin role is not allowed');
        }

        // Ensure role is one of the allowed registration roles
        if (![UserRole.GENERATOR, UserRole.FACTORY, UserRole.DRIVER].includes(role)) {
          throw new BadRequestException('Invalid role. Must be one of: generator, factory, driver');
        }

        // Prepare Register-like object for validation and record creation
        const registerData: any = {
          ...googleSignupDto,
          name,
          email,
          role,
        };

        // Validate role-specific fields
        this.validateRoleSpecificFields(role, registerData);

        user = new this.userModel({
          email: email.toLowerCase().trim(),
          name,
          googleId,
          authProvider: 'google',
          role,
          isActive: true,
          profilePicture: picture,
        });

        await user.save();

        try {
          await this.createRoleSpecificRecord(role, (user._id as any).toString(), registerData);
        } catch (error) {
          await this.userModel.findByIdAndDelete(user._id);
          throw error;
        }
      }

      // Generate JWT token
      const payload = {
        sub: (user._id as any).toString(),
        email: user.email,
        role: user.role,
      };
      const accessToken = this.jwtService.sign(payload);

      // Return user without password and token
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...userWithoutPassword } = user.toObject();
      return {
        user: userWithoutPassword,
        accessToken,
      };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof UnauthorizedException) {
        throw error;
      }
      // Firebase verification errors
      throw new UnauthorizedException('Invalid Google ID token');
    }
  }

  async requestPasswordReset(forgetPasswordDto: ForgetPasswordRequestDto): Promise<{ message: string }> {
    const email = forgetPasswordDto.email.toLowerCase().trim();

    // Find user by email
    const user = await this.userModel.findOne({ email });

    // Don't reveal if user exists or not (security best practice)
    // But we still need to check if user has password (not Google OAuth only)
    if (user && (!user.password || user.authProvider === 'google')) {
      throw new BadRequestException('This account uses Google sign-in. Please use Google to sign in.');
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Set expiration to 5 minutes
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5);

    // Store code with email
    this.resetCodes.set(email, {
      code,
      expiresAt,
      email,
      verified: false,
    });

    // Send email with code
    await this.emailService.sendPasswordResetCode(email, code);

    return {
      message: 'Password reset code has been sent to your email',
    };
  }

  async verifyResetCode(verifyCodeDto: VerifyResetCodeDto): Promise<{ message: string; verified: boolean }> {
    const email = verifyCodeDto.email.toLowerCase().trim();
    const code = verifyCodeDto.code;

    const resetData = this.resetCodes.get(email);

    if (!resetData) {
      throw new BadRequestException('Invalid or expired reset code');
    }

    if (resetData.expiresAt < new Date()) {
      this.resetCodes.delete(email);
      throw new BadRequestException('Reset code has expired');
    }

    if (resetData.code !== code) {
      throw new BadRequestException('Invalid reset code');
    }

    // Mark code as verified
    resetData.verified = true;
    this.resetCodes.set(email, resetData);

    return {
      message: 'Reset code verified successfully',
      verified: true,
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    const email = resetPasswordDto.email.toLowerCase().trim();
    const { newPassword, confirmPassword } = resetPasswordDto;

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    // Check if reset code exists and is valid
    const resetData = this.resetCodes.get(email);
    if (!resetData) {
      throw new BadRequestException('Reset code not found. Please request a new one.');
    }

    if (resetData.expiresAt < new Date()) {
      this.resetCodes.delete(email);
      throw new BadRequestException('Reset code has expired. Please request a new one.');
    }

    if (!resetData.verified) {
      throw new BadRequestException('Please verify the reset code first.');
    }

    // Find user
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Check if user has password (not Google OAuth only)
    if (!user.password || user.authProvider === 'google') {
      throw new BadRequestException('This account uses Google sign-in. Please use Google to sign in.');
    }

    // Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    user.password = hashedPassword;
    await user.save();

    // Remove used reset code
    this.resetCodes.delete(email);

    return {
      message: 'Password has been reset successfully',
    };
  }

  async verifyEmail(verifyEmailDto: VerifyEmailDto): Promise<{ message: string }> {
    const email = verifyEmailDto.email.toLowerCase().trim();
    const code = verifyEmailDto.code;

    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const verificationData = this.emailVerificationCodes.get(email);

    if (!verificationData) {
      throw new BadRequestException('Invalid or expired verification code');
    }

    if (verificationData.expiresAt < new Date()) {
      this.emailVerificationCodes.delete(email);
      throw new BadRequestException('Verification code has expired');
    }

    if (verificationData.code !== code) {
      throw new BadRequestException('Invalid verification code');
    }

    // Mark code as verified
    verificationData.verified = true;
    user.isVerified = true;
    await user.save();
    this.emailVerificationCodes.set(email, verificationData);


    return {
      message: 'Email verified successfully',
    };
  }

  async verifyPhone(verifyPhoneDto: VerifyPhoneDto): Promise<{ message: string }> {
    const phone = verifyPhoneDto.phone.trim();
    const code = verifyPhoneDto.code;

    const user = await this.userModel.findOne({ phone });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const verificationData = this.phoneVerificationCodes.get(phone);

    if (!verificationData) {
      throw new BadRequestException('Invalid or expired verification code');
    }

    if (verificationData.expiresAt < new Date()) {
      this.phoneVerificationCodes.delete(phone);
      throw new BadRequestException('Verification code has expired');
    }

    if (verificationData.code !== code) {
      throw new BadRequestException('Invalid verification code');
    }

    // Mark code as verified
    verificationData.verified = true;
    user.isVerified = true;
    await user.save();
    this.phoneVerificationCodes.set(phone, verificationData);

    return {
      message: 'Phone verified successfully',
    };
  }

  private cleanupExpiredCodes(): void {
    const now = new Date();
    for (const [email, data] of this.resetCodes.entries()) {
      if (data.expiresAt < now) {
        this.resetCodes.delete(email);
      }
    }
  }

  private cleanupExpiredEmailVerificationCodes(): void {
    const now = new Date();
    for (const [email, data] of this.emailVerificationCodes.entries()) {
      if (data.expiresAt < now) {
        this.emailVerificationCodes.delete(email);
      }
    }
  }

  private cleanupExpiredPhoneVerificationCodes(): void {
    const now = new Date();
    for (const [phone, data] of this.phoneVerificationCodes.entries()) {
      if (data.expiresAt < now) {
        this.phoneVerificationCodes.delete(phone);
      }
    }
  }

}
