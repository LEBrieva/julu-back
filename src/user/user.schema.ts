import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { UserRole, UserStatus } from './user.enum';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ required: false })
  phone?: string;

  @Prop({ type: String, enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Prop({ type: String, enum: UserStatus, default: UserStatus.ACTIVE })
  status: UserStatus;

  @Prop({ default: Date.now })
  lastLogin?: Date;

  @Prop({ default: false })
  emailVerified: boolean;

  @Prop()
  avatar?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ status: 1 });