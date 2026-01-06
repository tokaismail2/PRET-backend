import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
} from '@nestjs/common';
import { WarehouseService } from './warehouse.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';

@Controller('warehouses')
export class WarehouseController {
  constructor(private readonly warehouseService: WarehouseService) {}

  @Post()
  async create(@Body() dto: CreateWarehouseDto) {
    const warehouse = await this.warehouseService.create(dto);

    return {
      success: true,
      message: 'Warehouse created successfully',
      data: warehouse,
    };
  }

  @Get()
  async findAll(
    @Query('isActive') isActive?: string,
  ) {
    const warehouses = await this.warehouseService.findAll({
      isActive:
        isActive === 'true'
          ? true
          : isActive === 'false'
          ? false
          : undefined,
    });

    return {
      success: true,
      message: 'Warehouses fetched successfully',
      data: warehouses,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const warehouse = await this.warehouseService.findOne(id);

    return {
      success: true,
      message: 'Warehouse fetched successfully',
      data: warehouse,
    };
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateWarehouseDto,
  ) {
    const warehouse = await this.warehouseService.update(id, dto);

    return {
      success: true,
      message: 'Warehouse updated successfully',
      data: warehouse,
    };
  }
}
