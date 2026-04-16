import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
  BadRequestException,
  Req,
  Put,
  UseInterceptors,
  Query,  
} from '@nestjs/common';
import { UsersService } from './user.sevice';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import authorize from '../auth/guards/roles.guard';
import { UserRole } from '../models/user.schema';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Request } from 'express';
import { AuditLogInterceptorFactory } from "../audit-log/audit-log.interceptor";

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
// @authorize(UserRole.ADMIN)
export class UsersController {
  constructor(private readonly usersService: UsersService) { }


  @Post()
  @HttpCode(HttpStatus.CREATED)
    @UseInterceptors(
      AuditLogInterceptorFactory('create_user'),
    )
  async createUser(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.createUser(createUserDto);
    return { message: 'User created successfully', user };
  }
 

  //make it with pagination
  @Get()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getAllUsers(
    @Req() req: Request,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNumber = Math.max(1, parseInt(page ?? '1', 10) || 1);
    const limitNumber = Math.min(100, Math.max(1, parseInt(limit ?? '10', 10) || 10));
    const users = await this.usersService.getAllUsers(req, pageNumber, limitNumber);
    return { message: 'Users retrieved successfully', users };
  }

  // ---------------- GET USER BY ID ----------------
  @Get('by-id/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getUserById(@Param('id') id: string) {
    const user = await this.usersService.getUserById(id);
    return { message: 'User retrieved successfully', user };
  }


  @Put('by-id/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
      @UseInterceptors(
      AuditLogInterceptorFactory('update_user'),
    )
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const user = await this.usersService.updateUser(id, updateUserDto);
    return { message: 'User updated successfully', user };
  }

  @Delete('by-id/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
      @UseInterceptors(
      AuditLogInterceptorFactory('delete_user'),
    )
  async deleteUser(@Param('id') id: string) {
    await this.usersService.deleteUser(id);
    return { message: 'User deleted successfully' };
  }
}
