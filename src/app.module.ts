import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { FirebaseModule } from './firebase/firebase.module';
import { ImageKitModule } from './imagekit/imagekit.module';
import { PersonalInformationModule } from './personal_information/personal-information.module';
import { OrdersModule } from './orders/orders.module';
import { DonationsModule } from './donations/donations.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Make ConfigModule available globally
      envFilePath: ['.env', '.env.local'], // Try multiple .env files
      expandVariables: true, // Enable variable expansion in .env files
    }),
    DatabaseModule,
    FirebaseModule,
    ImageKitModule,
    AuthModule,
    PersonalInformationModule,
    OrdersModule,
    DonationsModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
