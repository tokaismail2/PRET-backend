import { Controller, Post, Body, Param, Get, Req, UseGuards, Put, Query } from '@nestjs/common';
import { AuctionService } from './service';
import { CreateAuctionDto } from './dto/create';
import authorize from '../auth/guards/roles.guard';
import { UserRole } from '../models/user.schema';
import { CreateBidDto } from './dto/createBid';
import { AuthGuard } from '@nestjs/passport';


@Controller('auction')
export class AuctionController {
  constructor(private readonly auctionService: AuctionService) { }

  @Post('open')
  @authorize(UserRole.ADMIN)
  openAuction(@Body() dto: CreateAuctionDto) {
    return this.auctionService.createAuction(dto);
  }

  @Get()
  @authorize(UserRole.ADMIN)
  getAll() {
    return this.auctionService.getAllAuctionsWithBids();
  }

  @Get('active')
  @authorize(UserRole.FACTORY)
  getActiveAuctionsForFactory(@Req() req) {
    return this.auctionService.getActiveAuctionsForFactory(req.user.userId);
  }

  @Get('wastes')
   @authorize(UserRole.FACTORY)
  getWasteAuctions(
    @Query('status') status?: 'open' | 'closed',
  ) {
    return this.auctionService.getWasteAuctions(status);
  }
  @Post(':id/bid')
  @authorize(UserRole.FACTORY)
  @UseGuards(AuthGuard('jwt'))
  bid(@Param('id') id: string, @Body() dto: CreateBidDto, @Req() req) {
    return this.auctionService.placeBid(id, dto.total_price, req.user.userId);
  }

  @Put('close/:id')
  @authorize(UserRole.ADMIN)
  @UseGuards(AuthGuard('jwt'))
  close(@Param('id') id: string, @Req() req: any) {
    return this.auctionService.closeAuction(id, req.user.userId); // ← pass admin id
  }

}
