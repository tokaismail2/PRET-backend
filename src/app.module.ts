import { Driver } from './models/driver.schema';
import { ReportModule } from './report/report.module';
import { UsersModule } from './user/user.module';
import {RatingModule  } from "./rating/rating.module";
import{PaymentModule} from './payment/pyment.module'
import { MaintenanceModule } from "./maintenance/maintenance.module";
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
import {AdminModule  } from "./admin/admin.module";
import { WasteModule } from './waste/wasteModel';
import { AuditLogModule } from "./audit-log/audit-log.module";
import { DriverAuthModule } from "./DriverAuth/driverAuth.module";
import {WarehouseModule} from "./warehouse/warehouse.module"
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
    ReportModule,
    RatingModule,
    PaymentModule,
    MaintenanceModule,
    PaymobModule,
    AdminModule,
    AuditLogModule,
    DriverAuthModule,
    WarehouseModule

  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
