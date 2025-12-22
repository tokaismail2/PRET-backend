import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RatingController } from './rating.controllar';
import { RatingService } from './rating.service';
import { Rating, RatingSchema } from '../models/rating.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: 'Rating', schema: RatingSchema },
        ]),
    ],
    controllers: [RatingController],
    providers: [RatingService],
    exports: [RatingService], // لو هتستخدميه في Modules تانية
})
export class RatingModule { }
