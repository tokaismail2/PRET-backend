import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Type } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditLog, AuditLogDocument } from '../../../models/auditLog.schema';

export function AuditLogInterceptorFactory(action: string): Type<NestInterceptor> {
  @Injectable()
  class AuditLogInterceptor implements NestInterceptor {
    constructor(
      @InjectModel(AuditLog.name)
      private readonly auditLogModel: Model<AuditLogDocument>,
    ) {}

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
      const ctx = context.switchToHttp();
      const req = ctx.getRequest();
      const res = ctx.getResponse();

      return next.handle().pipe(
        tap(async () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            if (!req.user || !req.user._id) return; // لو user مش موجود
            try {
              await this.auditLogModel.create({
                user: req.user._id,
                action
              });
            } catch (err) {
              console.error('Error saving audit log:', err);
            }
          }
        }),
        
      );
    }
  }

  return AuditLogInterceptor;
}
