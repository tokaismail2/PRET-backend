import { Controller, Post, Get, Patch, Delete, Body, Param, Req, UseGuards } from '@nestjs/common';
import { RatingService } from './rating.service';
import { CreateRatingDto } from './dto/create-rating.dto';
import { UpdateRatingDto } from './dto/update-rating.dto';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/decorators/user.decorator';


@Controller('ratings')
@UseGuards(AuthGuard('jwt'))
export class RatingController {
  constructor(private readonly ratingService: RatingService) {}

  @Post()
  create(@Body() dto: CreateRatingDto, @CurrentUser('id') userId: string) {
    return this.ratingService.create(dto, userId);
  }


  @Get('target/:id')
  findByTarget(@Param('id') targetId: string) {
    return this.ratingService.findByTarget(targetId);
  }

  @Patch(':id')
  update(@Param('id') ratingId: string, @Body() dto: UpdateRatingDto, @Req() req) {
    return this.ratingService.update(ratingId, dto, req.user.id);
  }

  @Delete(':id')
  remove(@Param('id') ratingId: string, @Req() req) {
    return this.ratingService.remove(ratingId, req.user.id);
  }
}
