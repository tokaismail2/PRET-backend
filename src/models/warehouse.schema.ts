import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type WarehouseDocument = Warehouse & Document;

@Schema({ timestamps: true }) 
export class Warehouse {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  contract_number: string;

  
  @Prop({ required: true })
  contract_duration: number; // in months

  @Prop({
    required: true,
    type: {
      address: { type: String, required: true },
      coordinates: {
        latitude: { type: Number, required: true },
        longitude: { type: Number, required: true },
      }
    }
  })
  location: {
    address: string;
    coordinates: {
      latitude: number;
      longitude: number;
    }
  };

  @Prop({ default: true })
  is_active: boolean;
}

export const WarehouseSchema = SchemaFactory.createForClass(Warehouse);
