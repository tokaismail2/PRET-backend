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
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/user.decorator';
import { ImageKitService } from '../imagekit/imagekit.service';
import { MulterFile } from '../common/types/multer-file.type';
import { multerConfig } from '../common/config/multer.config';
import { OrderStatus } from '../models/order.schema';

@Controller('orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly imageKitService: ImageKitService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FilesInterceptor('photos', 3, multerConfig))
  async createOrder(
    @CurrentUser() user: any,
    @Body() body: any,
    @UploadedFiles() files?: MulterFile[],
  ) {
    // Parse nested JSON fields from form data
    let createOrderDto: CreateOrderDto;
    try {
      createOrderDto = {
        materialType: body.materialType,
        quantity: parseFloat(body.quantity),
        unit: body.unit,
        price: parseFloat(body.price),
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
              'orders/photos',
              `order-${Date.now()}-${file.originalname}`,
            )
            .then((result) => result.url),
        ),
      );
    }

    // Add photo URLs to DTO
    const orderData = {
      ...createOrderDto,
      photos: photoUrls.length > 0 ? photoUrls : createOrderDto.photos,
    };

    const order = await this.ordersService.createOrder(
      user.userId,
      orderData,
    );

    return {
      message: 'Order created successfully',
      order,
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getMyOrders(
    @CurrentUser() user: any,
    @Query('status') status?: string,
  ) {
    let statusEnum: OrderStatus | undefined;
    if (status) {
      statusEnum = Object.values(OrderStatus).find(
        (s) => s.toLowerCase() === status.toLowerCase(),
      ) as OrderStatus;
      if (!statusEnum) {
        throw new BadRequestException(
          `Invalid status. Valid values: ${Object.values(OrderStatus).join(', ')}`,
        );
      }
    }
    const orders = await this.ordersService.getOrdersByUser(user.userId, statusEnum);
    return {
      message: 'Orders retrieved successfully',
      orders,
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getOrderById(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    const order = await this.ordersService.getOrderById(id, user.userId.toString());
    return {
      message: 'Order retrieved successfully',
      order,
    };
  }
}

