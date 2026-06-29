import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ThresholdController } from './threshold.controller';
import { ThresholdService } from './threshold.service';
import { Threshold, ThresholdSchema } from '../models/threshold.schema';
import { PassportModule } from '@nestjs/passport';
import { AuditLog, AuditLogSchema } from '../models/auditLog.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Threshold.name, schema: ThresholdSchema },
      { name: AuditLog.name, schema: AuditLogSchema },
    ]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [ThresholdController],
  providers: [ThresholdService],
  exports: [ThresholdService],
})
export class ThresholdModule { }
