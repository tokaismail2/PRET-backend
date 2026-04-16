import {
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    UseGuards,
    Query,
} from '@nestjs/common';
import { AuditLogService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/user.decorator';

@Controller('audit-logs')
@UseGuards(JwtAuthGuard)
export class AuditLogController {
    constructor(private readonly auditLogService: AuditLogService) { }
   //pagination and search
    @Get('admin')
    async getAdminAuditLogs(@Query() query: any) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const role = query.role;
    const skip = (page - 1) * limit;

    const total = await this.auditLogService.getAdminAuditLogsCount();
    const totalPages = Math.ceil(total / limit);

    return {
      message: 'Audit logs fetched successfully',
      data: {
        auditLogs: await this.auditLogService.getAdminAuditLogs(skip, limit,role),
        pagination: { total, page, limit, totalPages },
      },
    };

   

  }
}

