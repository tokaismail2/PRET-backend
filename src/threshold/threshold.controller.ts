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
import { ThresholdService } from './threshold.service';
import { CreateThresholdDto } from './dto/add-theshold.dto';
import { UpdateThresholdDto } from './dto/update-threshold.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuditLogInterceptorFactory } from "../audit-log/audit-log.interceptor";
import { UseInterceptors } from '@nestjs/common';
import authorize from '../auth/guards/roles.guard';
import { UserRole } from '../models/user.schema';

@Controller('threshold')
export class ThresholdController {
  constructor(private readonly thresholdService: ThresholdService) { }

  @Post()
  @UseGuards(JwtAuthGuard)
  @authorize(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    AuditLogInterceptorFactory('threshold_create'),
  )
  create(@Body() createThresholdDto: CreateThresholdDto) {
    return this.thresholdService.create(createThresholdDto);
  }
  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNumber = Math.max(1, parseInt(page ?? '1', 10) || 1);
    const limitNumber = Math.min(100, Math.max(1, parseInt(limit ?? '10', 10) || 10));

    const result = await this.thresholdService.findAll(pageNumber, limitNumber);

    return result;
  }
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.thresholdService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    AuditLogInterceptorFactory('update_threshold'),
  )
  update(@Param('id') id: string, @Body() updateThresholdDto: UpdateThresholdDto) {
    return this.thresholdService.update(id, updateThresholdDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    AuditLogInterceptorFactory('delete_threshold'),
  )
  remove(@Param('id') id: string) {
    return this.thresholdService.remove(id);
  }
}
