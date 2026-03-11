import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

export enum UserRole {
  GENERATOR = 'generator',
  FACTORY = 'factory',
  DRIVER = 'driver',
  ADMIN = 'admin',
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: function () { return !this.authProvider || this.authProvider === 'email'; } })
  password?: string;

  @Prop({ enum: ['email', 'google'], default: 'email' })
  authProvider?: 'email' | 'google';

  @Prop()
  googleId?: string;

  @Prop({ required: true })
  name: string;

  @Prop({ trim: true })
  phone?: string;

  @Prop({ required: true, enum: UserRole, default: UserRole.GENERATOR })
  role: UserRole;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isVerified: boolean;

  @Prop()
  profilePicture?: string;

  @Prop({ select: false })
  __v: number;

  createdAt?: Date;
  updatedAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

//create user wallet after registeration and isVerified is true
UserSchema.post('save', async function (doc) {
  if (doc.isVerified) {
    const WalletModel = doc.model('UserWallet');
    const existingWallet = await WalletModel.findOne({ userId: doc._id });
    if (!existingWallet) {
      await WalletModel.create({
        userId: doc._id,
        balance: 0,
      });
    }
  }
});




UserSchema.index(
  { email: 1 },
  {
    unique: true,
    partialFilterExpression: { isVerified: true }
  }
);

UserSchema.index(
  { phone: 1 },
  {
    unique: true,
    partialFilterExpression: { isVerified: true }
  }
);