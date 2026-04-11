import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuditLog, AuditLogSchema } from '../models/auditLog.schema';
import { AuditLogController } from './dashboard.controller';
import { AuditLogService } from './dashboard.service';


@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AuditLog.name, schema: AuditLogSchema },
    ]),
  ],
  exports: [MongooseModule],
  controllers: [AuditLogController],
  providers: [AuditLogService],
})
export class AuditLogModule {}




