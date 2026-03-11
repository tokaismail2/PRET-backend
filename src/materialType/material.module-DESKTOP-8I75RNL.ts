import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MaterialController } from './material.controller';
import { MaterialService } from './material.service';
import { Material, MaterialSchema } from '../models/material.schema';
import { PassportModule } from '@nestjs/passport';
import { AuditLog, AuditLogSchema } from '../models/auditLog.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Material.name, schema: MaterialSchema },
      { name: AuditLog.name, schema: AuditLogSchema },
    ]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [MaterialController],
  providers: [MaterialService],
  exports: [MaterialService],
})
export class MaterialModule { }
