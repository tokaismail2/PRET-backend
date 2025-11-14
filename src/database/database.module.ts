import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema, Order, OrderSchema } from '../models';

const mongoUri =
  process.env.MONGO_URI && process.env.MONGO_URI.trim() !== ''
    ? process.env.MONGO_URI
    : 'mongodb://localhost:27017/';

if (!mongoUri) {
  throw new Error(
    'Missing MongoDB connection string. Set the MONGO_URI environment variable.',
  );
}
@Module({
  imports: [
    MongooseModule.forRoot(mongoUri),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Order.name, schema: OrderSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class DatabaseModule {}
