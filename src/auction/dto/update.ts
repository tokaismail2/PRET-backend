import { PartialType } from '@nestjs/mapped-types';
import { CreateAuctionDto } from './create';

export class UpdateAuctionDto extends PartialType(CreateAuctionDto) { }
