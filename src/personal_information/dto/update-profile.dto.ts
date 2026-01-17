import {IsEmail, IsOptional } from "class-validator";

export class UpdateProfileDto {
    @IsOptional()
    name: string;

    @IsOptional()
    phone: string;

    @IsEmail()
    email: string;

}