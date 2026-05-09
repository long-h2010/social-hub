import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { Chat } from './chat.schema';
import { User } from './user.schema';

@Schema({ timestamps: true })
export class Message {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Chat' })
  chat: Chat;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  sender: User;

  @Prop()
  message: string;

  @Prop()
  images: string[];

  @Prop([{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }])
  readed: User[];
}

export const MessageSchema = SchemaFactory.createForClass(Message);
