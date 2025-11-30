import mongoose from 'mongoose';
import { AuditLogDocument, AuditLogSchema } from '../../models/auditLog.schema';

function auditLog(action: string) {
  return (req: any, res: any, next: any) => {
    res.on('finish', async () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {

          const AuditLogModel =
            mongoose.models.AuditLog ||
            mongoose.model('AuditLog', AuditLogSchema as any);

          await AuditLogModel.create({
            user: req.user._id,
            action,
          });
        } catch (error) {
          console.error('Error saving audit log:', error);
        }
      }
    });

    next();
  };
}

export default auditLog;
