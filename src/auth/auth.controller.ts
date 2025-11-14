import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginEmailDto } from './dto/login-email.dto';
import { LoginPhoneDto } from './dto/login-phone.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto) {
    const user = await this.authService.register(registerDto);
    return {
      message: 'User registered successfully',
      user,
    };
  }

  @Post('login/email')
  @HttpCode(HttpStatus.OK)
  async loginWithEmail(@Body() loginEmailDto: LoginEmailDto) {
    const user = await this.authService.loginWithEmail(loginEmailDto);
    return {
      message: 'Login successful',
      user,
    };
  }

  @Post('login/phone')
  @HttpCode(HttpStatus.OK)
  async loginWithPhone(@Body() loginPhoneDto: LoginPhoneDto) {
    const user = await this.authService.loginWithPhone(loginPhoneDto);
    return {
      message: 'Login successful',
      user,
    };
  }
}
