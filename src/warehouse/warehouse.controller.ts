import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  Delete,
} from '@nestjs/common';
import { WarehouseService } from './warehouse.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import authorize from '../auth/guards/roles.guard';
import { UserRole } from '../models/user.schema';
import { AuditLogInterceptorFactory } from "../audit-log/audit-log.interceptor";
import { UseInterceptors } from '@nestjs/common';

@Controller('warehouses')
@UseGuards(JwtAuthGuard, RolesGuard)
@authorize(UserRole.ADMIN, UserRole.DRIVER)
export class WarehouseController {
  constructor(private readonly warehouseService: WarehouseService) { }

  @Post()
  @UseInterceptors(
    AuditLogInterceptorFactory('create_warehouse'),
  )
  async create(@Body() dto: CreateWarehouseDto) {
    const warehouse = await this.warehouseService.create(dto);

    return {
      message: 'Warehouse created successfully',
      data: warehouse,
    };
  }

  @Get()
  async findAll(
    @Query('isActive') isActive?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNumber = Math.max(1, parseInt(page ?? '1', 10) || 1);
    const limitNumber = Math.min(100, Math.max(1, parseInt(limit ?? '10', 10) || 10));

    const result = await this.warehouseService.findAll(
      {
        isActive:
          isActive === 'true' ? true :
            isActive === 'false' ? false :
              undefined,
      },
      pageNumber,
      limitNumber,
    );

    return {
      message: 'Warehouses fetched successfully',
      data: result.data,
      pagination: {
        total: result.total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(result.total / limitNumber),
      },
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const warehouse = await this.warehouseService.findOne(id);

    return {
      message: 'Warehouse fetched successfully',
      data: warehouse,
    };
  }

  @Patch(':id')
  @UseInterceptors(
    AuditLogInterceptorFactory('update_warehouse'),
  )
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateWarehouseDto,
  ) {
    const warehouse = await this.warehouseService.update(id, dto);

    return {
      message: 'Warehouse updated successfully',
      data: warehouse,
    };
  }

  @Delete(':id')
  @UseInterceptors(
    AuditLogInterceptorFactory('delete_warehouse'),
  )
  async remove(@Param('id') id: string) {
    const warehouse = await this.warehouseService.remove(id);

    return {
      message: 'Warehouse deleted successfully',
      data: warehouse,
    };
  }
}
