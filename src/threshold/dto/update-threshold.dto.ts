import { PartialType } from '@nestjs/mapped-types';
import { CreateThresholdDto } from './add-theshold.dto';

export class UpdateThresholdDto extends PartialType(CreateThresholdDto) { }
