import { Controller, Post, Body, Param, Get, Req, UseGuards, Put, Query } from '@nestjs/common';
import { CharityService } from './service';
import { CreateCharityDto } from './dto/create';
import authorize from '../auth/guards/roles.guard';
import { UserRole } from '../models/user.schema';

@Controller('charity')
export class CharityController {
  constructor(private readonly charityService: CharityService) { }

  @Post('create')
  createCharity(@Body() dto: CreateCharityDto) {
    return this.charityService.createCharity(dto);
  }


  //paginate charity for admin
  @Get('get')  
  @authorize(UserRole.ADMIN)
  async getCharity(@Query() query: any) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const skip = (page - 1) * limit;
    return this.charityService.getCharity(skip, limit);

  }
}
