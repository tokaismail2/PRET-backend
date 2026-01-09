import {
  Controller,
  Put,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Get
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../models/user.schema';
import { UpdateOrderDto } from '../admin/dto/update-order.dto';

@Controller('admin/data')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) { }
  @Get('/users')
  async getUsers() {
    const users = await this.adminService.getUsers();
    return {
      message: 'Users fetched successfully',
      data: users,
    };
  }

  @Get('/drivers')
  async getDrivers() {
    const drivers = await this.adminService.getDrivers();
    return {
      message: 'Drivers fetched successfully',
      data: drivers,
    };
  }
  @Put(':orderId')
  @HttpCode(HttpStatus.OK)
  async updateOrder(
    @Param('orderId') orderId: string,
    @Body() updateDto: UpdateOrderDto,
  ) {
    const order = await this.adminService.updateOrderById(
      orderId,
      updateDto,
    );

    return order;
  }

}
