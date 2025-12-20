import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { RatingService } from './rating.service';
import { CreateRatingDto } from './dto/create-rating.dto';
import { UpdateRatingDto } from './dto/update-rating.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('ratings')
@UseGuards(AuthGuard('jwt'))
export class RatingController {
  constructor(private readonly ratingService: RatingService) {}

  // ⭐ Create rating
  @Post()
  create(@Body() dto: CreateRatingDto, @Req() req) {
    return this.ratingService.create(dto, req.user.id);
  }

  // ⭐ Get all ratings for specific target (order / donation)
  @Get('target/:id')
  findByTarget(@Param('id') targetId: string) {
    return this.ratingService.findByTarget(targetId);
  }

  // ⭐ Update rating
  @Patch(':id')
  update(
    @Param('id') ratingId: string,
    @Body() dto: UpdateRatingDto,
    @Req() req,
  ) {
    return this.ratingService.update(ratingId, dto, req.user.id);
  }

  // ⭐ Delete rating
  @Delete(':id')
  remove(@Param('id') ratingId: string, @Req() req) {
    return this.ratingService.remove(ratingId, req.user.id);
  }
}
