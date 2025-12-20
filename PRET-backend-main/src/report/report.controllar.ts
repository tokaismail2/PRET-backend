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
import { ReportService } from './report.service';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('reports')
@UseGuards(AuthGuard('jwt'))
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  // 📝 create report
  @Post()
  create(@Body() dto: CreateReportDto, @Req() req) {
    return this.reportService.create(dto, req.user.id);
  }

  // 👤 my reports
  @Get('me')
  findMine(@Req() req) {
    return this.reportService.findMyReports(req.user.id);
  }

  // 🛠 admin - all reports
  @Get()
  findAll() {
    return this.reportService.findAll();
  }

  // 🔄 admin update status
  @Patch(':id')
  update(
    @Param('id') reportId: string,
    @Body() dto: UpdateReportDto,
  ) {
    return this.reportService.update(reportId, dto);
  }
}
