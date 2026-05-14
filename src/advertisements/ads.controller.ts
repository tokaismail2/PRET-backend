import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
  Query,
  Get,
  Delete,
  Param,
} from '@nestjs/common';

import { FilesInterceptor } from '@nestjs/platform-express';

import { AdsService } from './ads.services';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

import { AddAdsDto } from './dto/addAds';

import { ImageKitService } from '../imagekit/imagekit.service';

import { MulterFile } from '../common/types/multer-file.type';
import { multerConfig } from '../common/config/multer.config';

import { AuditLogInterceptorFactory } from 'src/audit-log/audit-log.interceptor';

@Controller('ads')
export class AdsController {
  constructor(
    private readonly adsService: AdsService,
    private readonly imageKitService: ImageKitService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FilesInterceptor('image', 5, multerConfig),
    AuditLogInterceptorFactory('create_ads'),
  )
  async addAds(
    @Body() body: any,
    @UploadedFiles() files?: MulterFile[],
  ) {
    let createAdsDto: AddAdsDto;

    try {
      createAdsDto = {
        image: body.image
          ? typeof body.image === 'string'
            ? JSON.parse(body.image)
            : body.image
          : [],

        title: body.title,
        description: body.description,
      };
    } catch (error) {
      throw new BadRequestException('Invalid request data format');
    }

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
              'ads/photos',
              `ads-${Date.now()}-${file.originalname}`,
            )
            .then((result) => result.url),
        ),
      );
    }

    const adsData = {
      ...createAdsDto,
      image: photoUrls.length > 0 ? photoUrls : createAdsDto.image,
    };

    const ads = await this.adsService.addAds(adsData);

    return ads;
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async getAllAds(@Query() query: any) {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.max(1, parseInt(query.limit) || 10);
    return this.adsService.getAllAds(page, limit);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(AuditLogInterceptorFactory('delete_ads'))
  async deleteAds(@Param('id') id: string) {
    return this.adsService.deleteAds(id);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getSingleAds(@Param('id') id: string) {
    return this.adsService.getSingleAds(id);
  }
}