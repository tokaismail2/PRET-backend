//get audit logs for admin

import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { AuditLog, AuditLogDocument } from "../models/auditLog.schema";
import { User } from "../models/user.schema";

@Injectable()
export class AuditLogService {
    constructor(
        @InjectModel(AuditLog.name) private readonly auditLogModel: Model<AuditLogDocument>,
        @InjectModel(User.name) private readonly userModel: Model<User>,
    ) { }

    //add filter by role 
    async getAdminAuditLogs(skip: number, limit: number, role?: string) {
        let userIds: any[] | undefined;
        if (role) {
            const users = await this.userModel.find({ role }).select('_id').lean();
            userIds = users.map(u => u._id);

            if (userIds.length === 0) return [];
        }

        const query: Record<string, any> = {};
        if (userIds) {
            query.user = { $in: userIds };
        }

        return await this.auditLogModel
            .find(query)
            .sort({ createdAt: -1 })
            .populate('user', 'name role')
            .skip(skip)
            .limit(limit)
            .lean();
    }

    async getAdminAuditLogsCount() {
        const auditLogs = await this.auditLogModel.countDocuments();
        return auditLogs;
    }
}