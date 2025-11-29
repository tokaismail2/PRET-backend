import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { DonationsService } from './donations.service';
import { CreateDonationDto } from './dto/create-donation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/user.decorator';
import { ImageKitService } from '../imagekit/imagekit.service';
import { MulterFile } from '../common/types/multer-file.type';

@Controller('donations')
export class DonationsController {
  constructor(
    private readonly donationsService: DonationsService,
    private readonly imageKitService: ImageKitService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FilesInterceptor('photos', 3))
  async createDonation(
    @CurrentUser() user: any,
    @Body() body: any,
    @UploadedFiles() files?: MulterFile[],
  ) {
    // Parse nested JSON fields from form data
    let createDonationDto: CreateDonationDto;
    try {
      createDonationDto = {
        mealsProvided: parseInt(body.mealsProvided, 10),
        pickupLocation: typeof body.pickupLocation === 'string'
          ? JSON.parse(body.pickupLocation)
          : body.pickupLocation,
        notes: body.notes,
        photos: body.photos
          ? (typeof body.photos === 'string'
              ? JSON.parse(body.photos)
              : body.photos)
          : undefined,
      };
    } catch (error) {
      throw new BadRequestException('Invalid request data format');
    }

    // Upload photos if provided
    let photoUrls: string[] = [];
    if (files && files.length > 0) {
      if (files.length > 3) {
        throw new BadRequestException('Maximum 3 photos allowed');
      }

      photoUrls = await Promise.all(
        files.map((file) =>
          this.imageKitService
            .uploadFile(
              file,
              'donations/photos',
              `donation-${Date.now()}-${file.originalname}`,
            )
            .then((result) => result.url),
        ),
      );
    }

    // Add photo URLs to DTO
    const donationData = {
      ...createDonationDto,
      photos: photoUrls.length > 0 ? photoUrls : createDonationDto.photos,
    };

    const donation = await this.donationsService.createDonation(
      user.userId,
      donationData,
    );

    return {
      message: 'Donation created successfully',
      donation,
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getMyDonations(@CurrentUser() user: any) {
    const donations = await this.donationsService.getDonationsByUser(
      user.userId,
    );
    return {
      message: 'Donations retrieved successfully',
      donations,
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getDonationById(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    const donation = await this.donationsService.getDonationById(
      id,
      user.userId,
    );
    return {
      message: 'Donation retrieved successfully',
      donation,
    };
  }
}

