// import {
//   Controller,
//   Get,
//   HttpCode,
//   HttpStatus,
//   UseGuards,
// } from '@nestjs/common';
// import { DashboardService } from './dashboard.service';
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
// import { CurrentUser } from '../auth/decorators/user.decorator';

// @Controller('dashboard')
// export class DashboardController {
//   constructor(private readonly dashboardService: DashboardService) {}

//   @Get('home')
//   @UseGuards(JwtAuthGuard)
//   @HttpCode(HttpStatus.OK)
//   async getHome(@CurrentUser() user: any) {
//     const dashboard = await this.dashboardService.getDashboard(user.userId);
//     return {
//       message: 'Dashboard data retrieved successfully',
//       dashboard,
//     };
//   }
// }

