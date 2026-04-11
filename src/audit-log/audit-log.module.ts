import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuditLog, AuditLogSchema } from '../models/auditLog.schema';
import { AuditLogController } from './dashboard.controller';
import { AuditLogService } from './dashboard.service';
import { User, UserSchema } from '../models/user.schema';


@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AuditLog.name, schema: AuditLogSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  exports: [MongooseModule],
  controllers: [AuditLogController],
  providers: [AuditLogService],
})
export class AuditLogModule {}




