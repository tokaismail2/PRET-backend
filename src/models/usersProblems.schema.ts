import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";


import { Document, Types } from 'mongoose';

export type UsersProblemsDocument = UsersProblems & Document;


@Schema({ timestamps: true })
export class UsersProblems {
    @Prop({type: Types.ObjectId, ref: 'User'})
    userId: Types.ObjectId;

    @Prop()
    problem: string;
}

export const UsersProblemsSchema = SchemaFactory.createForClass(UsersProblems);
