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
} from '@nestjs/common';
import { UsersService } from './user.sevice';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import authorize from '../auth/guards/roles.guard';
import { UserRole } from '../models/user.schema';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Request } from 'express';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@authorize(UserRole.ADMIN)

export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  // ---------------- CREATE USER ----------------
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createUser(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.createUser(createUserDto);
    return { message: 'User created successfully', user };
  }

  // ---------------- GET ALL USERS ----------------
  @Get()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getAllUsers(@Req() req: Request) {
    const users = await this.usersService.getAllUsers(req);
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

  // ---------------- UPDATE USER ----------------
  @Put('by-id/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const user = await this.usersService.updateUser(id, updateUserDto);
    return { message: 'User updated successfully', user };
  }

  // ---------------- DELETE USER ----------------
  @Delete('by-id/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async deleteUser(@Param('id') id: string) {
    await this.usersService.deleteUser(id);
    return { message: 'User deleted successfully' };
  }
}
