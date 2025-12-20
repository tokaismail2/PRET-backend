import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { MaintenanceService } from './maintenance.service';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { UpdateMaintenanceDto } from './dto/update-maintenance.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('maintenance')
@UseGuards(AuthGuard('jwt'))
export class MaintenanceController {
  constructor(
    private readonly maintenanceService: MaintenanceService,
  ) {}

  // 🛠 create request
  @Post()
  create(@Body() dto: CreateMaintenanceDto, @Req() req) {
    return this.maintenanceService.create(dto, req.user.id);
  }

  // 👤 my requests
  @Get('me')
  findMine(@Req() req) {
    return this.maintenanceService.findMyRequests(req.user.id);
  }

  // 🛠 admin - all
  @Get()
  findAll() {
    return this.maintenanceService.findAll();
  }

  // 🔄 admin update
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateMaintenanceDto,
  ) {
    return this.maintenanceService.update(id, dto);
  }
}
