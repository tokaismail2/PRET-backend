import { PartialType } from '@nestjs/mapped-types';
import { CreateWasteDto } from './creat';

export class UpdateWasteDto extends PartialType(CreateWasteDto) {}
