//get audit logs for admin

import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { AuditLog, AuditLogDocument } from "../models/auditLog.schema";

@Injectable()
export class AuditLogService {
    constructor(
        @InjectModel(AuditLog.name) private readonly auditLogModel: Model<AuditLogDocument>,
    ) { }
     
    //add filter by role 
    async getAdminAuditLogs(skip: number, limit: number , role?: string) {
        const query: Record<string, any> = {};
        if(role){
            query.role = role;
        }
        const auditLogs = await this.auditLogModel.find(query).sort({ createdAt: -1 })
        .populate('user', 'name role')
        .skip(skip).limit(limit).lean();
        return auditLogs;
    }

    async getAdminAuditLogsCount() {
        const auditLogs = await this.auditLogModel.countDocuments();
        return auditLogs;
    }
}