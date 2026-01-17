import { IsString } from "class-validator";

export class RequestProblemDto {
    @IsString()
    problem: string;
}