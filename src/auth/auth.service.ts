import {
  Injectable,
  ConflictException,
  BadRequestException,
  UnauthorizedException,
  InternalServerErrorException,
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
import { Types } from 'mongoose';


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
  // // In-memory store for email verification codes (consider using Redis in production)
  // private emailVerificationCodes = new Map<string, EmailVerificationCodeData>();
  // // In-memory store for phone verification codes (consider using Redis in production)
  // private phoneVerificationCodes = new Map<string, PhoneVerificationCodeData>();

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
      // this.cleanupExpiredEmailVerificationCodes();
      // this.cleanupExpiredPhoneVerificationCodes();
    }, 5 * 60 * 1000);
  }

  async register(
    registerDto: RegisterDto,
  ): Promise<Omit<User, 'password'> | { message: string }> {
    const email = registerDto.email.toLowerCase().trim();
    const phone = registerDto.phone?.trim();

    const role: UserRole =
      (registerDto.role as unknown as UserRole) || UserRole.GENERATOR;

    if (
      ![UserRole.GENERATOR, UserRole.FACTORY, UserRole.DRIVER].includes(role)
    ) {
      throw new BadRequestException(
        'Invalid role. Must be generator, factory, or driver',
      );
    }

    this.validateRoleSpecificFields(role, registerDto);

    // ─── Find existing user ───────────────────────────────────────────────────
    let user = await this.userModel.findOne({ email });

    if (!user && phone) {
      user = await this.userModel.findOne({ phone });
    }

    // ─── Already verified → reject ───────────────────────────────────────────
    if (user?.isVerified) {
      throw new ConflictException('User already exists');
    }

    // ─── Create user if new ──────────────────────────────────────────────────
    if (!user) {
      const hashedPassword = await bcrypt.hash(registerDto.password, 10);
      user = new this.userModel({
        email,
        password: hashedPassword,
        name: registerDto.name,
        phone,
        role,
      });
      await user.save();
    }

    // ─── Create role-specific record (idempotent) ─────────────────────────────
    try {
      await this.createRoleSpecificRecord(role, user._id.toString(), registerDto);
    } catch (err) {
      console.error('❌ createRoleSpecificRecord failed:', err.message); 
      const hasProfile = await this.profileExists(role, user._id.toString());
      if (!hasProfile) {
        await this.userModel.deleteOne({ _id: user._id });
      }
      throw new InternalServerErrorException(
        'Failed to create profile. Please try again.',
      );
    }

    // ─── Driver: verification by admin ──────────────────────────────────────
    if (role === UserRole.DRIVER) {
      user.isVerified = false;
      await user.save();

      const userObj = user.toObject();
      delete userObj.password;
      return userObj;
    }

    // ─── Non-driver: send verification ───────────────────────────────────────
    const verificationMethod = registerDto.verificationMethod || 'email';

    if (verificationMethod === 'phone') {
      if (!phone) {
        throw new BadRequestException(
          'Phone number is required for phone verification',
        );
      }

      // TODO: Replace with a real SMS provider
      const code = '123456';

      user.verificationCode = code;
      user.verificationCodeExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
      await user.save();

      return { message: 'Verification code sent to phone' };
    }

    // ─── Default: email verification ─────────────────────────────────────────
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    user.verificationCode = code;
    user.verificationCodeExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await user.save();

    await this.emailService.sendEmailVerificationCode(email, code);

    return { message: 'Verification code sent to email' };
  }
  // ─── Helpers ────────────────────────────────────────────────────────────────

  private async profileExists(role: UserRole, userId: string): Promise<boolean> {
    const id = new Types.ObjectId(userId);
    switch (role) {
      case UserRole.GENERATOR:
        return !!(await this.generatorModel.exists({ user: id }));
      case UserRole.FACTORY:
        return !!(await this.factoryModel.exists({ user: id }));
      case UserRole.DRIVER:
        return !!(await this.driverModel.exists({ user: id }));
      default:
        return false;
    }
  }

  private validateRoleSpecificFields(role: UserRole, dto: RegisterDto) {
    if (role === UserRole.GENERATOR) {
      if (!dto.generatorType)
        throw new BadRequestException('Generator type is required');
      if (!dto.businessName)
        throw new BadRequestException('Business name is required');
    }
  }

  private async createRoleSpecificRecord(
    role: UserRole,
    userId: string,
    dto: RegisterDto,
  ) {
    const id = new Types.ObjectId(userId);

    if (role === UserRole.GENERATOR) {
      // Idempotent: skip if already exists
      const exists = await this.generatorModel.exists({ user: id });
      if (!exists) {
        const generator = new this.generatorModel({
          user: id,
          generatorType: dto.generatorType,
          businessName: dto.businessName,
          address: dto.address,
        });
        await generator.save();
      }
    } else if (role === UserRole.FACTORY) {
      const exists = await this.factoryModel.exists({ user: id });
      if (!exists) {
        const factory = new this.factoryModel({
          user: id,
          businessName: dto.businessName,
          address: dto.address, // required in schema — validated before this call
        });
        await factory.save();
      }
    } else if (role === UserRole.DRIVER) {
      const exists = await this.driverModel.exists({ user: id });
      if (!exists) {
        const driver = new this.driverModel({
          user: id,
          latitude: dto.address?.coordinates?.latitude,
          longitude: dto.address?.coordinates?.longitude,
          address: dto.address
            ? {
              street: dto.address.street,
              city: dto.address.city,
              state: dto.address.state,
              zipCode: dto.address.zipCode,
              country: dto.address.country,
            }
            : undefined,
        });
        await driver.save();
      }
    }
  }

  // ─── Shared login logic ──────────────────────────────────────────────────────

  private async buildLoginResponse(user: UserDocument) {
    let profile: any = null;

    switch (user.role) {
      case UserRole.GENERATOR:
        profile = await this.generatorModel.findOne({ user: user._id });
        break;
      case UserRole.FACTORY:
        profile = await this.factoryModel.findOne({ user: user._id });
        break;
      case UserRole.DRIVER:
        profile = await this.driverModel.findOne({ user: user._id });
        break;
      case UserRole.ADMIN:
        profile = { type: 'admin' };
        break;
    }

    if (!profile) {
      // Profile missing despite verified user — data integrity issue
      throw new InternalServerErrorException(
        'User profile not found. Please contact support.',
      );
    }

    const payload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);

    const userObj = user.toObject();
    delete userObj.password;

    return { user: userObj, profile, accessToken };
  }

  // ─── Login with email ────────────────────────────────────────────────────────

  async loginWithEmail(loginEmailDto: LoginEmailDto) {
    const email = loginEmailDto.email.toLowerCase().trim();

    const user = await this.userModel.findOne({ email });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isVerified) {
      throw new UnauthorizedException('Please verify your account first');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    if (!user.password || user.authProvider === 'google') {
      throw new UnauthorizedException('Please sign in with Google');
    }

    // const isPasswordValid = await bcrypt.compare(
    //   loginEmailDto.password,
    //   user.password,
    // );

    // if (!isPasswordValid) {
    //   throw new UnauthorizedException('Invalid email or password');
    // }

    return this.buildLoginResponse(user);
  }

  // ─── Login with phone ────────────────────────────────────────────────────────

  async loginWithPhone(loginPhoneDto: LoginPhoneDto) {
    const user = await this.userModel.findOne({
      phone: loginPhoneDto.phone.trim(),
      isVerified: true,
    });

    if (!user) {
      throw new UnauthorizedException('Invalid phone number or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    if (!user.password || user.authProvider === 'google') {
      throw new UnauthorizedException('Please sign in with Google');
    }

    const isPasswordValid = await bcrypt.compare(
      loginPhoneDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid phone number or password');
    }

    return this.buildLoginResponse(user);
  }

  // ─── Verify email ────────────────────────────────────────────────────────────

  async verifyEmail(verifyEmailDto: VerifyEmailDto): Promise<{ message: string }> {
    const email = verifyEmailDto.email.toLowerCase().trim();

    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (!user.verificationCode) {
      throw new BadRequestException('No verification code found. Please request a new one.');
    }

    if (user.verificationCodeExpiresAt < new Date()) {
      user.verificationCode = undefined;
      user.verificationCodeExpiresAt = undefined;
      await user.save();
      throw new BadRequestException('Verification code has expired. Please request a new one.');
    }

    if (user.verificationCode !== verifyEmailDto.code) {
      throw new BadRequestException('Invalid verification code');
    }

    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpiresAt = undefined;
    await user.save();

    return { message: 'Email verified successfully' };
  }

  // ─── Verify phone ────────────────────────────────────────────────────────────

  async verifyPhone(verifyPhoneDto: VerifyPhoneDto): Promise<{ message: string }> {
    const phone = verifyPhoneDto.phone.trim();

    const user = await this.userModel.findOne({ phone });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (!user.verificationCode) {
      throw new BadRequestException('No verification code found. Please request a new one.');
    }

    if (user.verificationCodeExpiresAt < new Date()) {
      user.verificationCode = undefined;
      user.verificationCodeExpiresAt = undefined;
      await user.save();
      throw new BadRequestException('Verification code has expired. Please request a new one.');
    }

    if (user.verificationCode !== verifyPhoneDto.code) {
      throw new BadRequestException('Invalid verification code');
    }

    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpiresAt = undefined;
    await user.save();

    return { message: 'Phone verified successfully' };
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
          isVerified: true,
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
  private cleanupExpiredCodes(): void {
    const now = new Date();
    for (const [email, data] of this.resetCodes.entries()) {
      if (data.expiresAt < now) {
        this.resetCodes.delete(email);
      }
    }
  }

  // private cleanupExpiredEmailVerificationCodes(): void {
  //   const now = new Date();
  //   for (const [email, data] of this.emailVerificationCodes.entries()) {
  //     if (data.expiresAt < now) {
  //       this.emailVerificationCodes.delete(email);
  //     }
  //   }
  // }

  // private cleanupExpiredPhoneVerificationCodes(): void {
  //   const now = new Date();
  //   for (const [phone, data] of this.phoneVerificationCodes.entries()) {
  //     if (data.expiresAt < now) {
  //       this.phoneVerificationCodes.delete(phone);
  //     }
  //   }
  // }

}
