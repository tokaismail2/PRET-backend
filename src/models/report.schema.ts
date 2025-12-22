import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ReportDocument = Report & Document;

export enum ReportStatus {
  OPEN = 'OPEN',
  IN_REVIEW = 'IN_REVIEW',
  RESOLVED = 'RESOLVED',
  REJECTED = 'REJECTED',
  PENDING = "PENDING",
}

@Schema({ timestamps: true })
export class Report {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  reporter: Types.ObjectId;

  @Prop({ required: true })
  targetId: string; // orderId | donationId | userId | paymentId

  @Prop({ required: true })
  targetType: string; // ORDER | DONATION | USER | PAYMENT

  @Prop({ required: true })
  reason: string;

  @Prop()
  description?: string;

  @Prop({
    enum: ReportStatus,
    default: ReportStatus.OPEN,
  })
  status: ReportStatus;
}

export const ReportSchema = SchemaFactory.createForClass(Report);
