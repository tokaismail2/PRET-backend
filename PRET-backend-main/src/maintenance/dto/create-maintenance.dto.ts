import { IsString } from 'class-validator';

export class CreateMaintenanceDto {
  @IsString()
  title: string;

  @IsString()
  description: string;
}
