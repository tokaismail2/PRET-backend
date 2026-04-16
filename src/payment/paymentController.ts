// waste.controller.ts
import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
  Query,
  Req,
  UseGuards,
  Put,
} from '@nestjs/common';
import { PaymentService } from './paymentService';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { authorize } from '../auth/guards/roles.guard';
import { UserRole } from '../models/user.schema';


@Controller('payment')
@UseGuards(JwtAuthGuard)
@authorize(UserRole.ADMIN, UserRole.FACTORY)
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) { }


  @Get()
  findAll(
    @Req() req: Request,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNumber = Math.max(1, parseInt(page ?? '1', 10) || 1);
    const limitNumber = Math.min(100, Math.max(1, parseInt(limit ?? '10', 10) || 10));

    return this.paymentService.findAll(req, pageNumber, limitNumber);
  }


}
