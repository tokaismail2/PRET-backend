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
import { GoogleSignupDto } from './dto/google-signup.dto';
import { FirebaseService } from '../firebase/firebase.service';
import { EmailService } from '../email/email.service';
import { ForgetPasswordRequestDto } from './dto/forget-password-request.dto';
import { VerifyResetCodeDto } from './dto/verify-reset-code.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

interface ResetCodeData {
  code: string;
  expiresAt: Date;
  email: string;
  verified: boolean;
}

@Injectable()
export class AuthService {
  // In-memory store for reset codes (consider using Redis in production)
  private resetCodes = new Map<string, ResetCodeData>();

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
    private firebaseService: FirebaseService,
    private emailService: EmailService,
  ) {
    // Clean up expired codes every 5 minutes
    setInterval(() => this.cleanupExpiredCodes(), 5 * 60 * 1000);
  }

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

    // Check if user has a password (not a Google OAuth user)
    if (!user.password || user.authProvider === 'google') {
      throw new UnauthorizedException('Please sign in with Google');
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

    // Check if user has a password (not a Google OAuth user)
    if (!user.password || user.authProvider === 'google') {
      throw new UnauthorizedException('Please sign in with Google');
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

      const role = googleSignupDto.role || UserRole.GENERATOR;

      // Validate generatorType based on role
      if (role === UserRole.GENERATOR && !googleSignupDto.generatorType) {
        throw new BadRequestException(
          'Generator type is required when role is generator',
        );
      }

      if (role === UserRole.FACTORY && googleSignupDto.generatorType) {
        throw new BadRequestException(
          'Generator type should not be provided when role is factory',
        );
      }

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
        // Create new user
        const userData: any = {
          email: email.toLowerCase().trim(),
          name,
          googleId,
          authProvider: 'google',
          role,
          isActive: true,
        };

        if (picture) {
          userData.profilePicture = picture;
        }

        // Only include generatorType if role is generator
        if (role === UserRole.GENERATOR) {
          userData.generatorType = googleSignupDto.generatorType;
        }

        user = new this.userModel(userData);
        await user.save();
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

  async requestPasswordReset(forgetPasswordDto: ForgetPasswordRequestDto): Promise<{ message: string}> {
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
    
    // Set expiration to 30 minutes
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 30);
    
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

  private maskEmail(email: string): string {
    const [localPart, domain] = email.split('@');
    if (localPart.length <= 3) {
      return `${localPart[0]}***@${domain}`;
    }
    const visiblePart = localPart.substring(0, 3);
    return `${visiblePart}***@${domain}`;
  }

  private cleanupExpiredCodes(): void {
    const now = new Date();
    for (const [email, data] of this.resetCodes.entries()) {
      if (data.expiresAt < now) {
        this.resetCodes.delete(email);
      }
    }
  }
}
