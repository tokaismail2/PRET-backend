import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Report, ReportDocument, ReportStatus } from '../models/report.schema';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';

@Injectable()
export class ReportService {
  constructor(
    @InjectModel(Report.name)
    private readonly reportModel: Model<ReportDocument>,
  ) {}

  // 📝 create report
  async create(dto: CreateReportDto, userId: string) {
    return this.reportModel.create({
      ...dto,
      reporter: userId,
    });
  }

  // 👤 user reports
  async findMyReports(userId: string) {
    return this.reportModel.find({ reporter: userId });
  }

  // 🛠 admin - all reports
  async findAll() {
    return this.reportModel.find();
  }

  // 🔄 update status (admin)
  async update(reportId: string, dto: UpdateReportDto) {
    const report = await this.reportModel.findById(reportId);

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    report.status = dto.status;
    return report.save();
  }
}
