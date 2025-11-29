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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PersonalInformationService } from './personal-information.service';
import { UpdateLocationDto } from '../auth/dto/update-location.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/user.decorator';

@Controller('personal-information')
export class PersonalInformationController {
  constructor(
    private readonly personalInformationService: PersonalInformationService,
  ) {}

  @Patch('update-location')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
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

  @Post('upload-logo')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('logo'))
  @HttpCode(HttpStatus.OK)
  async uploadLogo(
    @CurrentUser() user: any,
    @UploadedFile() file: any,
  ) {
    if (!file) {
      throw new BadRequestException('Logo file is required');
    }

    const updatedUser = await this.personalInformationService.uploadLogo(
      user.userId,
      file,
    );
    return {
      message: 'Logo uploaded successfully',
      user: updatedUser,
    };
  }
}

