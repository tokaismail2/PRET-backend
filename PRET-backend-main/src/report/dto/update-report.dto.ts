import { IsEnum } from 'class-validator';
import { ReportStatus } from '../../models/report.schema';

export class UpdateReportDto {
  @IsEnum(ReportStatus)
  status: ReportStatus;
}
