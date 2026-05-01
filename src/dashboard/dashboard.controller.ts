import {
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    UseGuards,
    Query,
} from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/user.decorator';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) { }

    @Get('generator')
    @HttpCode(HttpStatus.OK)
    async getGeneratorDashboard(
        @CurrentUser() user: any,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        const dashboard = await this.dashboardService.getGeneratorDashboard(user.userId, startDate, endDate);
        return {
            message: 'Generator dashboard data retrieved successfully',
            dashboard,
        };
    }

    @Get('factory')
    @HttpCode(HttpStatus.OK)
    async getFactoryDashboard(
        @CurrentUser() user: any,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        const dashboard = await this.dashboardService.getFactoryDashboard(user.userId, startDate, endDate);
        return {
            message: 'Factory dashboard data retrieved successfully',
            dashboard,
        };
    }

    @Get('driver')
    @HttpCode(HttpStatus.OK)
    async getDriverDashboard(
        @CurrentUser() user: any,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        const dashboard = await this.dashboardService.getDriverDashboard(user.userId, startDate, endDate);
        return {
            message: 'Driver dashboard data retrieved successfully',
            dashboard,
        };
    }

    @Get('admin')
    async getAdminDashboard(
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        return this.dashboardService.getAdminDashboard(
            startDate ? new Date(startDate) : undefined,
            endDate ? new Date(endDate) : undefined,
        );
    }
}

