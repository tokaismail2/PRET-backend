
import { UsersModule } from './user/user.module';
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
import { PaymobModule } from "./paymob/paymob.module";
import { AdminModule } from "./admin/admin.module";
import { WasteModule } from './waste/wasteModule';
import { AuditLogModule } from "./audit-log/audit-log.module";
import { WarehouseModule } from "./warehouse/warehouse.module"
import { MaterialModule } from './materialType/material.module';
import { AuctionModule } from './auction/module';
import { CharityModule } from './charity/module';
import { PaymentModule } from './payment/paymentModule';
import { MongooseModule } from '@nestjs/mongoose';








@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // مهم عشان يقرأ .env
    MongooseModule.forRoot(process.env.MONGO_URI),

    WasteModule,

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
    UsersModule,
    PaymobModule,
    AdminModule,
    AuditLogModule,
    WarehouseModule,
    MaterialModule,
    AuctionModule,
    CharityModule,
    PaymentModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
