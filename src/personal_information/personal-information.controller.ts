import {
  Controller,
  Patch,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Get,
  Put,
  Delete
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PersonalInformationService } from './personal-information.service';
import { UpdateLocationDto } from '../auth/dto/update-location.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/user.decorator';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AuditLogInterceptorFactory } from "../audit-log/audit-log.interceptor";
import authorize from '../auth/guards/roles.guard';
import { UserRole } from '../models/user.schema';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { RequestProblemDto } from './dto/request-problem.dto';


@Controller('personal-information')
export class PersonalInformationController {
  constructor(
    private readonly personalInformationService: PersonalInformationService,
  ) { }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @authorize(UserRole.ADMIN, UserRole.DRIVER, UserRole.FACTORY, UserRole.GENERATOR)
  @UseInterceptors(
    AuditLogInterceptorFactory('change_password'),
  )

  async changePassword(
    @CurrentUser() user: any,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    const updatedUser = await this.personalInformationService.changePassword(
      user.userId,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword,
    );
    return {
      message: 'Password changed successfully',
      user: updatedUser,
    };
  }

  @Post('add-image')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @authorize(UserRole.ADMIN, UserRole.DRIVER, UserRole.FACTORY, UserRole.GENERATOR)
  @UseInterceptors(
    FileInterceptor('image'),
    AuditLogInterceptorFactory('add_image'),
  )
  async addImage(
    @CurrentUser() user: any,
    @UploadedFile() file: any,
  ) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }

    const updatedUser = await this.personalInformationService.updateProfilePicture(
      user.userId,
      file,
    );
    return {
      message: 'Image added successfully',
      user: updatedUser,
    };
  }

  @Delete('delete-image')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @authorize(UserRole.ADMIN, UserRole.DRIVER, UserRole.FACTORY, UserRole.GENERATOR)
  @UseInterceptors(
    AuditLogInterceptorFactory('delete_image'),
  )
  async deleteImage(
    @CurrentUser() user: any,
  ) {
    const updatedUser = await this.personalInformationService.deleteProfilePicture(
      user.userId,
    );
    return {
      message: 'Image deleted successfully',
      user: updatedUser,
    };
  }


  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @authorize(UserRole.ADMIN, UserRole.DRIVER, UserRole.FACTORY, UserRole.GENERATOR)
  async getProfile(@CurrentUser() user: any) {
    const userData = await this.personalInformationService.getProfile(user.userId);
    return {
      message: 'Profile retrieved successfully',
      userData,
    };
  }
  @Put('profile')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @authorize(UserRole.ADMIN, UserRole.DRIVER, UserRole.FACTORY, UserRole.GENERATOR)
  @UseInterceptors(
    AuditLogInterceptorFactory('update_profile'),
  )
  async updateProfile(
    @CurrentUser() user: any,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    const updatedUser = await this.personalInformationService.updateProfile(
      user.userId,
      updateProfileDto,
    );
    return {
      message: 'Profile updated successfully',
      user: updatedUser,
    };
  }

  @Post('problem')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @authorize(UserRole.ADMIN, UserRole.DRIVER, UserRole.FACTORY, UserRole.GENERATOR)
  @UseInterceptors(
    AuditLogInterceptorFactory('request_problem'),
  )
  async requestProblem(
    @CurrentUser() user: any,
    @Body() requestProblemDto: RequestProblemDto,
  ) {
    const updatedUser = await this.personalInformationService.requestProblem(
      user.userId,
      requestProblemDto,
    );
    return {
      message: 'Problem requested successfully',
      user: updatedUser,
    };
  }

  @Get('problem')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @authorize(UserRole.ADMIN)
  async getProblem() {
    const usersProblems = await this.personalInformationService.getProblem();
    return {
      message: 'Problem retrieved successfully',
      usersProblems,
    };
  }

  @Put('location')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @authorize(UserRole.ADMIN, UserRole.DRIVER, UserRole.FACTORY, UserRole.GENERATOR)
  @UseInterceptors(
    AuditLogInterceptorFactory('update_location'),
  )
  async updateLocation(
    @CurrentUser() user: any,
    @Body() updateLocationDto: UpdateLocationDto,
  ) {
    const updatedUser = await this.personalInformationService.updateLocation(
      user.userId,
      updateLocationDto,
    );
    return {
      message: 'Location updated successfully',
      user: updatedUser,
    };
  }

  @Get('wallet')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @authorize(UserRole.DRIVER, UserRole.FACTORY, UserRole.GENERATOR)
  async getWallet(@CurrentUser() user: any) {
    const wallet = await this.personalInformationService.getMyWallet(user.userId);
    return {
      message: 'Wallet retrieved successfully',
      wallet,
    };
  }


}

