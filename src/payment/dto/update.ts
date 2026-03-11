import { PartialType } from '@nestjs/mapped-types';
import { CreateWasteDto } from './create';
import { IsOptional, IsString } from 'class-validator';

export class UpdateWasteDto extends PartialType(CreateWasteDto) {
    @IsOptional()
    @IsString()
    status: string;

 }
