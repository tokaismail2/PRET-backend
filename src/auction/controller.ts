import { Controller, Post, Body, Param, Get } from '@nestjs/common';
import { AuctionService } from './service';
import { CreateAuctionDto } from './dto/create';
import { BidDto } from './dto/bid';

@Controller('auction')
export class AuctionController {
  constructor(private readonly auctionService: AuctionService) {}

  // 🤖 AI opens auction
  @Post('open')
  openAuction(@Body() dto: CreateAuctionDto) {
    return this.auctionService.createAuction(dto);
  }

  // 🏭 factories place bids
  @Post(':id/bid')
  bid(@Param('id') id: string, @Body() bid: BidDto) {
    return this.auctionService.placeBid(id, bid);
  }

  // ❌ close auction
  @Post(':id/close')
  close(@Param('id') id: string) {
    return this.auctionService.closeAuction(id);
  }

  @Get()
  getAll() {
    return this.auctionService.getAllAuctions();
  }
}
