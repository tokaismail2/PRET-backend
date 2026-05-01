import { Controller, Post, Body, Param, Get, Req, UseGuards, Put, Query } from '@nestjs/common';
import { AuctionService } from './service';
import { CreateAuctionDto } from './dto/create';
import authorize from '../auth/guards/roles.guard';
import { UserRole } from '../models/user.schema';
import { CreateBidDto } from './dto/createBid';
import { AuthGuard } from '@nestjs/passport';
import { ImageKitService } from '../imagekit/imagekit.service';
import { multerConfig } from '../common/config/multer.config';
import { UseInterceptors, UploadedFiles } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { AuditLogInterceptorFactory } from '../audit-log/audit-log.interceptor';
import { MulterFile } from '../common/types/multer-file.type';
@Controller('auction')
export class AuctionController {
  constructor(
    private readonly auctionService: AuctionService,
    private readonly imageKitService: ImageKitService,
  ) { }

  @Post('open')
  @authorize(UserRole.ADMIN)
  @UseInterceptors(
    FilesInterceptor('image', 1, multerConfig),
    AuditLogInterceptorFactory('create_auction'),
  )
  async openAuction(
    @Body() dto: CreateAuctionDto,
    @UploadedFiles() files?: MulterFile[],
  ) {
    // Handle image upload in controller
    if (files && files.length > 0) {
      const file = files[0];
      const result = await this.imageKitService.uploadFile(
        file,
        'auctions',
        `auction-${Date.now()}-${file.originalname}`,
      );
      dto.image = result.url;
    }

    return this.auctionService.createAuction(dto);
  }

  @Get()
  @authorize(UserRole.ADMIN)
  async getAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNumber = Math.max(1, parseInt(page ?? '1', 10) || 1);
    const limitNumber = Math.min(100, Math.max(1, parseInt(limit ?? '10', 10) || 10));

    const result = await this.auctionService.getAllAuctionsWithBids(pageNumber, limitNumber);

    return result
  }

  @Get('active')
  @authorize(UserRole.FACTORY)
  getActiveAuctions(@Query('material') material?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.auctionService.getActiveAuctions(material, pageNum, limitNum);
  }

  @Get('wastes')
  @authorize(UserRole.FACTORY)
  getWasteAuctions(
    @Query('status') status?: 'open' | 'closed',
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.auctionService.getWasteAuctions(status, pageNum, limitNum);
  }

  @Get('my-waste-auctions')
  @authorize(UserRole.FACTORY)
  @UseGuards(AuthGuard('jwt'))
  getWasteAuction(
    @Req() req: any,
    @Query('active') active?: string,
    @Query('completed') completed?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const isActive = active === 'true' ? true : undefined;
    const isCompleted = completed === 'true' ? true : undefined;
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.auctionService.getWasteAuction(req.user.userId, isActive, isCompleted, pageNum, limitNum);
  }

  @Get(':id/bids')
  @authorize(UserRole.ADMIN, UserRole.FACTORY)
  getRecentBids(@Param('id') id: string) {
    return this.auctionService.getRecentBids(id);
  }

  @Post(':id/bid')
  @authorize(UserRole.FACTORY)
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(
    AuditLogInterceptorFactory('bid_on_auction'),
  )
  
  bid(@Param('id') id: string, @Body() dto: CreateBidDto, @Req() req) {
    return this.auctionService.placeBid(id, dto.total_price, req.user.userId);
  }

  @Put('close/:id')
  @authorize(UserRole.ADMIN)
  @UseGuards(AuthGuard('jwt'))
  close(@Param('id') id: string, @Req() req: any) {
    return this.auctionService.closeAuction(id, req.user.userId); // ← pass admin id
  }

  @Put('sign-is-finished/:id')
  @authorize(UserRole.FACTORY)
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(
    AuditLogInterceptorFactory('make_payment'),
  )
  signIsFinished(@Param('id') id: string, @Req() req: any) {
    return this.auctionService.signIsFinished(id, req.user.userId, req.body.payment_method);
  }

  @Get('check-payment/:id')
  @authorize(UserRole.FACTORY)
  @UseGuards(AuthGuard('jwt'))
  checkPayment(@Param('id') id: string) {
    return this.auctionService.checkPayment(id);
  }

  @Get(':id')
  @authorize(UserRole.ADMIN, UserRole.FACTORY)
  getAuctionById(@Param('id') id: string) {
    return this.auctionService.getAuctionById(id);
  }


}
