import mongoose, { Schema, Document } from 'mongoose';

export type User = Document & {
  googleId: string;
  email: string;
  name: string;
  isApproved: boolean;
  isAdmin: boolean;
};

const UserSchema: Schema = new Schema({
  googleId: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  isApproved: { type: Boolean, default: false },
  isAdmin: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model<User>('User', UserSchema);
