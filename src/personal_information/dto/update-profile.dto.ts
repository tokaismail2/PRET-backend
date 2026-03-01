import {
  IsEmail,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

// ─── Enums ────────────────────────────────────────────────────────────────────

export enum UserRole {
  DRIVER = 'driver',
  FACTORY = 'factory',
  GENERATOR = 'generator',
}

// ─── Sub-DTOs ─────────────────────────────────────────────────────────────────

export class BaseAddressDto {
  @IsOptional()
  @IsString()
  street?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  zipCode?: string;

  @IsOptional()
  @IsString()
  country?: string;
}

// ─── Unified Profile DTO ──────────────────────────────────────────────────────
// One shape for all roles.
// - Driver    → only `address` is used
// - Factory   → only `address` is used
// - Generator → `generatorType`, `businessName`, `address` are used

export class UpdateRoleProfileDto {
  // Generator only
  @IsOptional()
  @IsString()
  generatorType?: string;

  @IsOptional()
  @IsString()
  businessName?: string;

  // Shared across all roles
  @IsOptional()
  @ValidateNested()
  @Type(() => BaseAddressDto)
  address?: BaseAddressDto;
}

// ─── Main DTO ─────────────────────────────────────────────────────────────────

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateRoleProfileDto)
  profile?: UpdateRoleProfileDto;
}
