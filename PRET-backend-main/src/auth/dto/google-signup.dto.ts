import { IsString, IsOptional, IsEnum } from 'class-validator';
import { UserRole, GeneratorType } from '../../models/user.schema';

export class GoogleSignupDto {
  @IsString()
  idToken: string;

  @IsOptional()
  @IsEnum(UserRole, {
    message: 'Role must be one of: generator, factory, admin',
  })
  role?: UserRole;

  @IsOptional()
  @IsEnum(GeneratorType, {
    message:
      'Generator type must be one of: hotel, restaurant, cafe, office, residential, warehouse, other',
  })
  generatorType?: GeneratorType;
}

