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
  Query,
  Put,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { DonationsService } from './donations.service';
import { CreateDonationDto } from './dto/create-donation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/user.decorator';
import { ImageKitService } from '../imagekit/imagekit.service';
import { MulterFile } from '../common/types/multer-file.type';
import { multerConfig } from '../common/config/multer.config';
import authorize from '../auth/guards/roles.guard';
import { UserRole } from '../models/user.schema';
import { AuditLogInterceptorFactory } from "../audit-log/audit-log.interceptor";

@Controller('donations')
export class DonationsController {
  constructor(
    private readonly donationsService: DonationsService,
    private readonly imageKitService: ImageKitService,
  ) { }

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @authorize(UserRole.GENERATOR)
  @UseInterceptors(
    FilesInterceptor('photos', 3, multerConfig),
    AuditLogInterceptorFactory('create_donation'),
  )
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
        notes: body.notes,
        images: body.images
          ? (typeof body.images === 'string'
            ? JSON.parse(body.images)
            : body.images)
          : undefined,
      };
    } catch (error) {
      throw new BadRequestException('Invalid request data format');
    }

    // Upload photos if provided
    let photoUrls: string[] = [];
    if (files && files.length > 0) {
      if (files.length > 5) {
        throw new BadRequestException('Maximum 5 photos allowed');
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
      images: photoUrls.length > 0 ? photoUrls : createDonationDto.images,
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
  @authorize(UserRole.GENERATOR)
  async getMyDonations(@CurrentUser() user: any,@Query() query: any) {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.max(1, parseInt(query.limit) || 10);
    const donations = await this.donationsService.getDonationsByUser(
      user.userId,
      page,
      limit,
    );
    return {
      message: 'Donations retrieved successfully',
      pagination: {
        total: await this.donationsService.getDonationCount(),
        page,
        limit,
      },
      donations,
    };
  }

  @Get('get')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @authorize(UserRole.ADMIN)
  async getAllDonations(@Query() query: any) {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.max(1, parseInt(query.limit) || 10);

    return {
      pagination: {
        total: await this.donationsService.getDonationCount(),
        page,
        limit,
      },
      data: await this.donationsService.getAllDonations(page, limit),
    };
  }

  //assign donation to charity
  @Put(':id/assign')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @authorize(UserRole.ADMIN)
  @UseInterceptors(
    AuditLogInterceptorFactory('assign_donation'),
  )
  async assignDonation(
    @Param('id') id: string,
    @Body() body: { charityId: string },
  ) {
    const donation = await this.donationsService.assignDonation(
      id,
      body.charityId,
    );
    return {
      message: 'Donation assigned successfully',
      donation,
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @authorize(UserRole.GENERATOR, UserRole.ADMIN)
  async getDonationById(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    const donation = await this.donationsService.getDonationById(
      id,
      user.userId.toString(),
    );
    return {
      message: 'Donation retrieved successfully',
      donation,
    };
  }

}

