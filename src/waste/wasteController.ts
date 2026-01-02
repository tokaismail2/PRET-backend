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
import { CreateWasteDto } from './dto/creat';
import { UpdateWasteDto } from './dto/update';

@Controller('waste')
export class WasteController {
  constructor(private readonly wasteService: WasteService) {}

  // 1️⃣ Create waste
  @Post()
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

  // 🤖 AI – total quantity per type
  @Get('ai/total/:type')
  getTotalQuantity(@Param('type') type: string) {
    return this.wasteService.getTotalQuantityByType(type);
  }
}
