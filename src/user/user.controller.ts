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
} from '@nestjs/common';
import { UsersService } from './user.sevice';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/user.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

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
  async getAllUsers() {
    const users = await this.usersService.getAllUsers();
    return { message: 'Users retrieved successfully', users };
  }

  // ---------------- GET USER BY ID ----------------
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getUserById(@Param('id') id: string) {
    const user = await this.usersService.getUserById(id);
    return { message: 'User retrieved successfully', user };
  }

  // ---------------- UPDATE USER ----------------
  @Patch(':id')
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
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async deleteUser(@Param('id') id: string) {
    await this.usersService.deleteUser(id);
    return { message: 'User deleted successfully' };
  }
}
