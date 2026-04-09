// import {
//     Controller,
//     Get,
//     HttpCode,
//     HttpStatus,
//     UseGuards,
//     Query,
// } from '@nestjs/common';
// import { AuditLogService } from './dashboard.service';
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
// import { CurrentUser } from '../auth/decorators/user.decorator';

// @Controller('audit-logs')
// @UseGuards(JwtAuthGuard)
// export class AuditLogController {
//     constructor(private readonly auditLogService: AuditLogService) { }
//    //pagination and search
//     @Get('admin')
//     async getAdminAuditLogs(@Query() query: any) {
//     const page = parseInt(query.page) || 1;
//     const limit = parseInt(query.limit) || 10;
//     const skip = (page - 1) * limit;
//     return {
//       pagination: {
//         total: await this.auditLogService.getAdminAuditLogsCount(),
//         page,
//         limit,
//       },
//       data: await this.auditLogService.getAdminAuditLogs(skip, limit),
//     }
// }
// }

