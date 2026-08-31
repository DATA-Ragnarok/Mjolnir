import mongoose, { Schema, Document } from 'mongoose';
import { User } from './User.js';

export type ApiKey = Document & {
  key: string;
  userId: mongoose.Types.ObjectId | User;
  name: string;
  lastUsedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

const ApiKeySchema: Schema = new Schema({
  key: { type: String, required: true, unique: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, default: 'Agent Integration Key' },
  lastUsedAt: { type: Date },
  expiresAt: { type: Date },
}, { timestamps: true });

export default mongoose.model<ApiKey>('ApiKey', ApiKeySchema);
