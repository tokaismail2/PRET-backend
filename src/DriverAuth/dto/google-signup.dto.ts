import { IsString } from 'class-validator';


export class GoogleSignupDto {

  @IsString()
  idToken: string;

}

