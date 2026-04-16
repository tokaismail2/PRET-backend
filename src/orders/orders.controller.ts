import { AuditLog } from './../models/auditLog.schema';
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
  Delete,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { OrdersService } from './orders.service';
import { MaterialService } from '../materialType/material.service';
import { CreateOrderDto, ReceiveOrderFromGeneratorDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/user.decorator';
import { ImageKitService } from '../imagekit/imagekit.service';
import { MulterFile } from '../common/types/multer-file.type';
import { multerConfig } from '../common/config/multer.config';
import { OrderStatus } from '../models/order.schema';
import { AuditLogInterceptorFactory } from "../audit-log/audit-log.interceptor";
import { Material } from '../models/material.schema';
import { UpdateOrderDto } from './dto/update-order.dto';
import authorize from '../auth/guards/roles.guard';
import { UserRole } from '../models/user.schema';

@Controller('orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly imageKitService: ImageKitService,
    private readonly materialService: MaterialService,
  ) { }

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FilesInterceptor('photos', 3, multerConfig),
    AuditLogInterceptorFactory('create_order'),
  )
  async createOrder(
    @CurrentUser() user: any,
    @Body() body: any,
    @UploadedFiles() files?: MulterFile[],
  ) {
    let createOrderDto: CreateOrderDto;
    try {
      const material = await this.materialService.findOne(body.materialType);
      createOrderDto = {
        materialType: body.materialType,
        quantity: parseFloat(body.quantity),
        unit: body.unit,
        price: material.price,
        notes: body.notes,
        lat: body.lat ? parseFloat(body.lat) : undefined,   // 👈
        lng: body.lng ? parseFloat(body.lng) : undefined,   // 👈
        address: body.address,
        photos: body.photos
          ? (typeof body.photos === 'string'
            ? JSON.parse(body.photos)
            : body.photos)
          : undefined,
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
              'orders/photos',
              `order-${Date.now()}-${file.originalname}`,
            )
            .then((result) => result.url),
        ),
      );
    }

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
      data: order,
    };
  }

  @Post('assign-driver/route')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async assignDriverToRoute(
    @CurrentUser() user: any,
    @Body() body: { orders: string[] },
  ) {
    return this.ordersService.assignDriverToRoute(body.orders, user.userId);
  }

  @Post('arrive-warehouse')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async arriveToWarehouse(
    @CurrentUser() user: any,
    @Body() body: { orderIds: string[]; warehouseId: string; otp: string },
  ) {
    return this.ordersService.arriveToWarehouse(
      body.orderIds,
      body.warehouseId,
      body.otp,
      user.userId,
    );
  }

  @Post('receive-from-generator')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async receiveOrderFromGenerator(
    @CurrentUser() user: any,
    @Body() body: ReceiveOrderFromGeneratorDto,
  ) {
    return this.ordersService.receiveOrderFromGenerator(
      body.orderId,
      user.userId,
      body.order_code,
      body.is_received_from_generator,
    );
  }// ✅ Orders Controller - نفس pattern الـ AuditLogs
  @Get('history')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getMyOrdersHistory(
    @CurrentUser() user: any,
    @Query('status') status?: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    const pageNumber = Math.max(1, parseInt(page, 10) || 1);
    const limitNumber = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));

    const orders = await this.ordersService.getMyOrdersHistory(
      user.userId,
      status,
      pageNumber,
      limitNumber,
    );

    // ✅ نفس structure بتاع AuditLogs اللي شغال
    return orders;
  }

  @Get('all')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getAllOrders(
    @CurrentUser() user: any,
    @Query('status') status?: string,
    @Query('generatorId') generatorId?: string,
    @Query('driverId') driverId?: string,
    @Query('factoryId') factoryId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    const pageNumber = Math.max(1, parseInt(page, 10) || 1);
    const limitNumber = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));

    const result = await this.ordersService.getAllOrders({
      status,
      generatorId,
      driverId,
      factoryId,
      startDate,
      endDate,
      page: pageNumber,
      limit: limitNumber,
    });

    return result;
  }

    @Get('pending-routes')
    @HttpCode(HttpStatus.OK)
    @UseGuards(JwtAuthGuard)
    @authorize(UserRole.DRIVER)
    async getPendingRoutes() {
      const orders = await this.ordersService.getPendingRoutes();
      return {
        message: 'Pending routes retrieved successfully',
        data: orders,
      };
    }

    @Get('my-history-routes')
    @HttpCode(HttpStatus.OK)
    @UseGuards(JwtAuthGuard)
    @authorize(UserRole.DRIVER)
    async getMyHistoryRoutes(@CurrentUser() user: any) {
      return this.ordersService.getMyHistoryRoutes(user.userId);
    }

    @Get('route/:id')
    @HttpCode(HttpStatus.OK)
    @UseGuards(JwtAuthGuard)
    @authorize(UserRole.DRIVER)
    async getRouteById(
      @Param('id') routeId: string,
      @CurrentUser() user: any,
    ) {
      return this.ordersService.getRouteById(routeId, user.userId);
    }

    @Put('cancell/:id')
    @HttpCode(HttpStatus.OK)
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(AuditLogInterceptorFactory('cancel_order'))
    async cancelOrder(
      @Param('id') orderId: string,
      @CurrentUser() user: any,
      @Body() body: any,
    ) {
      return this.ordersService.cancelOrder(orderId, user.userId, body.reason);
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
        data: order,
      };
    }

    @Put(':id')
    @HttpCode(HttpStatus.OK)
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(
      FilesInterceptor('photos', 3, multerConfig),
      AuditLogInterceptorFactory('update_order'),
    )
    async updateOrderById(
      @Param('id') orderId: string,
      @Body() updateData: UpdateOrderDto,
      @UploadedFiles() files ?: MulterFile[],
    ) {
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
                'orders/photos',
                `order-${Date.now()}-${file.originalname}`,
              )
              .then((result) => result.url),
          ),
        );
      }

      const orderData = {
        ...updateData,
        photos: photoUrls.length > 0 ? photoUrls : updateData.photos,
      };
      return this.ordersService.updateOrderById(orderId, orderData);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    @UseGuards(JwtAuthGuard)
    async deleteOrder(
      @Param('id') orderId: string,
      @CurrentUser() user: any,
    ) {
      return this.ordersService.deleteOrder(orderId, user.userId, user.role);
    }

  }