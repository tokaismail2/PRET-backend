import { Controller, Post, Body, Param, Get } from '@nestjs/common';
import { AuctionService } from './service';
import { CreateAuctionDto } from './dto/create';
import authorize from '../auth/guards/roles.guard';
import { UserRole } from '../models/user.schema';
import { CreateBidDto } from './dto/createBid';

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

  @Post(':id/bid')
  @authorize(UserRole.FACTORY)
  bid(@Param('id') id: string, @Body() dto: CreateBidDto) {
    return this.auctionService.placeBid(id, dto.total_price, dto.factory_id);
  }

  @Post(':id/close')
  @authorize(UserRole.ADMIN)
  close(@Param('id') id: string) {
    return this.auctionService.closeAuction(id);
  }

}
