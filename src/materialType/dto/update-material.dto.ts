import { PartialType } from '@nestjs/mapped-types';
import { CreateMaterialDto } from './add-material.dto';

export class UpdateMaterialDto extends PartialType(CreateMaterialDto) { }
