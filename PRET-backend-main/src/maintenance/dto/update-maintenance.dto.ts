import { IsEnum } from 'class-validator';
import { MaintenanceStatus } from '../../models/maintenance.schema';

export class UpdateMaintenanceDto {
  @IsEnum(MaintenanceStatus)
  status: MaintenanceStatus;
}
