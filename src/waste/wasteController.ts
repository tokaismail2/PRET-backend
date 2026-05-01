// waste.controller.ts
import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
  Query,
} from '@nestjs/common';
import { WasteService } from './wasteService';
import { CreateWasteDto } from './dto/create';
import { UpdateWasteDto } from './dto/update';
import authorize from '../auth/guards/roles.guard';
import { UserRole } from '../models/user.schema';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Req } from '@nestjs/common';
import { AuditLogInterceptorFactory } from "../audit-log/audit-log.interceptor";
import { UseInterceptors } from '@nestjs/common';

@Controller('waste')
export class WasteController {
  constructor(private readonly wasteService: WasteService) { }

  @Post()
  @authorize(UserRole.ADMIN)
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(
    AuditLogInterceptorFactory('create_waste'),
  )
  create(@Body() createWasteDto: CreateWasteDto) {
    return this.wasteService.create(createWasteDto);
  }


  @Get()
  findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('status') status?: string ,
  ) {
    const pageNumber = Math.max(1, parseInt(page, 10) || 1);
    const limitNumber = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));

    return this.wasteService.findAll(pageNumber, limitNumber , status);
  }


  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.wasteService.findOne(id);
  }


  @Patch(':id')
  @UseInterceptors(
    AuditLogInterceptorFactory('update_waste'),
  )
  update(
    @Param('id') id: string,
    @Body() updateWasteDto: UpdateWasteDto,
  ) {
    return this.wasteService.update(id, updateWasteDto);
  }

  // 5️⃣ Delete waste
  @Delete(':id')
  @UseInterceptors(
    AuditLogInterceptorFactory('delete_waste'),
  )
  remove(@Param('id') id: string) {
    return this.wasteService.remove(id);
  }


}
