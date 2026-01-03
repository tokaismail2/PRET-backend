import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './driverAuth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginEmailDto } from './dto/login-email.dto';
import { LoginPhoneDto } from './dto/login-phone.dto';
import { GoogleSignupDto } from './dto/google-signup.dto';
import { ForgetPasswordRequestDto } from './dto/forget-password-request.dto';
import { VerifyResetCodeDto } from './dto/verify-reset-code.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { VerifyPhoneDto } from './dto/verify-phone.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('driver/register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto) {
    const driver = await this.authService.register(registerDto);
    return {
      message: 'Driver registered successfully',
      driver,
    };
  }

  @Post('driver/login/email')
  @HttpCode(HttpStatus.OK)
  async loginWithEmail(@Body() loginEmailDto: LoginEmailDto) {
    const driver = await this.authService.loginWithEmail(loginEmailDto);
    return {
      message: 'Login successful',
      driver,
    };
  }

  @Post('driver/login/phone')
  @HttpCode(HttpStatus.OK)
  async loginWithPhone(@Body() loginPhoneDto: LoginPhoneDto) {
    const driver = await this.authService.loginWithPhone(loginPhoneDto);
    return {
      message: 'Login successful',
      driver,
    };
  }

  @Post('driver/signup/google')
  @HttpCode(HttpStatus.OK)
  async signUpWithGoogle(@Body() googleSignupDto: GoogleSignupDto) {
    const result = await this.authService.signUpWithGoogle(googleSignupDto);
    return {
      message: 'Google sign-up successful',
      ...result,
    };
  }

  @Post('driver/forget-password')
  @HttpCode(HttpStatus.OK)
  async forgetPassword(@Body() forgetPasswordDto: ForgetPasswordRequestDto) {
    return await this.authService.requestPasswordReset(forgetPasswordDto);
  }

  @Post('driver/verify-reset-code')
  @HttpCode(HttpStatus.OK)
  async verifyResetCode(@Body() verifyCodeDto: VerifyResetCodeDto) {
    return await this.authService.verifyResetCode(verifyCodeDto);
  }

  @Post('driver/reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return await this.authService.resetPassword(resetPasswordDto);
  }

  @Post('driver/verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    return await this.authService.verifyEmail(verifyEmailDto);
  }

  @Post('driver/verify-phone')
  @HttpCode(HttpStatus.OK)
  async verifyPhone(@Body() verifyPhoneDto: VerifyPhoneDto) {
    return await this.authService.verifyPhone(verifyPhoneDto);
  }
}
