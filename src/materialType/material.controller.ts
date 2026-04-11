import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { MaterialService } from './material.service';
import { CreateMaterialDto } from './dto/add-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuditLogInterceptorFactory } from "../audit-log/audit-log.interceptor";
import { UseInterceptors } from '@nestjs/common';

@Controller('material')
export class MaterialController {
  constructor(private readonly materialService: MaterialService) { }

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    AuditLogInterceptorFactory('create_material'),
  )
  create(@Body() createMaterialDto: CreateMaterialDto) {
    return this.materialService.create(createMaterialDto);
  }
  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNumber = Math.max(1, parseInt(page ?? '1', 10) || 1);
    const limitNumber = Math.min(100, Math.max(1, parseInt(limit ?? '10', 10) || 10));

    const result = await this.materialService.findAll(pageNumber, limitNumber);

    return {
      message: 'Materials fetched successfully',
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
  findOne(@Param('id') id: string) {
    return this.materialService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    AuditLogInterceptorFactory('update_material'),
  )
  update(@Param('id') id: string, @Body() updateMaterialDto: UpdateMaterialDto) {
    return this.materialService.update(id, updateMaterialDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    AuditLogInterceptorFactory('delete_material'),
  )
  remove(@Param('id') id: string) {
    return this.materialService.remove(id);
  }
}
