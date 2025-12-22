import { Controller, Post, Get, Patch, Delete, Body, Param, Req, UseGuards } from '@nestjs/common';
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
  async create(@Body() dto: CreateReportDto, @Req() req) {
    if (!req.user?.userId) throw new Error('User not found in request');
    return this.reportService.create(dto, req.user.userId.toString());
  }

  // 👤 my reports
  @Get('me')
  async findMine(@Req() req) {
    if (!req.user?.userId) throw new Error('User not found in request');
    return this.reportService.findMyReports(req.user.userId.toString());
  }

  // 🛠 admin - all reports
  @Get()
  async findAll() {
    return this.reportService.findAll();
  }

  // 🧐 get report by id
  @Get(':id')
  async findOne(@Param('id') reportId: string) {
    return this.reportService.findById(reportId);
  }

  // 🔄 admin update report
  @Patch(':id')
  async update(@Param('id') reportId: string, @Body() dto: UpdateReportDto) {
    return this.reportService.update(reportId, dto);
  }

  // ❌ delete report
  @Delete(':id')
  async remove(@Param('id') reportId: string) {
    return this.reportService.delete(reportId);
  }
}
