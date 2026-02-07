// waste.controller.ts
import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import { WasteService } from './wasteService';
import { CreateWasteDto } from './dto/create';
import { UpdateWasteDto } from './dto/update';
import authorize from '../auth/guards/roles.guard';
import { UserRole } from '../models/user.schema';

@Controller('waste')
export class WasteController {
  constructor(private readonly wasteService: WasteService) { }

  // 1️⃣ Create waste
  @Post()
  @authorize(UserRole.ADMIN)
  create(@Body() createWasteDto: CreateWasteDto) {
    return this.wasteService.create(createWasteDto);
  }

  // 2️⃣ Get all waste
  @Get()
  findAll() {
    return this.wasteService.findAll();
  }

  // 3️⃣ Get waste by id
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.wasteService.findOne(id);
  }

  // 4️⃣ Update waste
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateWasteDto: UpdateWasteDto,
  ) {
    return this.wasteService.update(id, updateWasteDto);
  }

  // 5️⃣ Delete waste
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.wasteService.remove(id);
  }


}
