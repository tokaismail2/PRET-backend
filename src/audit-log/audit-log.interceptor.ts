import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Type } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditLog, AuditLogDocument } from '../models/auditLog.schema';
import { emitNotification } from '../common/utils/notifications.system';

export function AuditLogInterceptorFactory(action: string): Type<NestInterceptor> {
  @Injectable()
  class AuditLogInterceptor implements NestInterceptor {
    constructor(
      @InjectModel(AuditLog.name)
      private readonly auditLogModel: Model<AuditLogDocument>,
    ) { }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {

      const ctx = context.switchToHttp();
      const req = ctx.getRequest();
      const res = ctx.getResponse();

      return next.handle().pipe(
        tap({
          next: async () => {
            try {
              if (res.statusCode >= 200 && res.statusCode < 300) {
                const userId = req.user?._id || req.user?.userId || req.user?.id;
                if (!userId) return;

                await this.auditLogModel.create({
                  user: userId,
                  action,
                });

                console.log('AUDIT SAVED');

                //emit notification
                emitNotification('audit-log-tracked', {
                  user_name: req.user?.name,
                  user_role: req.user?.role,
                  action: action,
                });
                console.log('Audit log saved successfully');
                console.log('Audit log',  {
                  user_name: req.user?.name,
                  user_role: req.user?.role,
                  action: action,
                });
              }
            } catch (err) {
              console.error('Error saving audit log:', err);
            }
          }
        })
      );
    }
  }

  return AuditLogInterceptor;
}
