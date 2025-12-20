import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Rating, RatingDocument } from '../models/rating.schema';
import { CreateRatingDto } from './dto/create-rating.dto';
import { UpdateRatingDto } from './dto/update-rating.dto';

@Injectable()
export class RatingService {
  constructor(
    @InjectModel(Rating.name)
    private readonly ratingModel: Model<RatingDocument>,
  ) {}

  // ⭐ Create Rating
  async create(dto: CreateRatingDto, userId: string) {
    // prevent duplicate rating
    const existingRating = await this.ratingModel.findOne({
      user: userId,
      targetId: dto.targetId,
    });

    if (existingRating) {
      throw new BadRequestException(
        'You have already rated this item',
      );
    }

    const rating = await this.ratingModel.create({
      ...dto,
      user: userId,
    });

    return rating;
  }

  // ⭐ Get ratings for target (order / donation)
  async findByTarget(targetId: string) {
    const ratings = await this.ratingModel
      .find({ targetId })
      .populate('user', 'name email');

    return ratings;
  }

  // ⭐ Update Rating
  async update(
    ratingId: string,
    dto: UpdateRatingDto,
    userId: string,
  ) {
    const rating = await this.ratingModel.findById(ratingId);

    if (!rating) {
      throw new NotFoundException('Rating not found');
    }

    if (rating.user.toString() !== userId) {
      throw new UnauthorizedException(
        'You are not allowed to update this rating',
      );
    }

    Object.assign(rating, dto);
    return rating.save();
  }

  // ⭐ Delete Rating
  async remove(ratingId: string, userId: string) {
    const rating = await this.ratingModel.findById(ratingId);

    if (!rating) {
      throw new NotFoundException('Rating not found');
    }

    if (rating.user.toString() !== userId) {
      throw new UnauthorizedException(
        'You are not allowed to delete this rating',
      );
    }

    await rating.deleteOne();
    return { message: 'Rating deleted successfully' };
  }
}
