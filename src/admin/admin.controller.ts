import {
  Controller,
  Put,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../models/user.schema';
import { UpdateOrderDto } from '../admin/dto/update-order.dto';

@Controller('admin/orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

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

    return {
      message: 'Order updated successfully',
      order,
    };
  }
}
