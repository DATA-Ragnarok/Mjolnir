import mongoose, { Schema, Document } from 'mongoose';
import { User } from './User.js';

export type AgentSession = Document & {
  jti: string;
  userId: mongoose.Types.ObjectId | User;
  name: string;
  expiresAt: Date;
  revokedAt?: Date | null;
  lastUsedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

const AgentSessionSchema: Schema = new Schema({
  jti: { type: String, required: true, unique: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, default: 'Agent session' },
  // Keep documents for a day after expiry (so revoked/expired state is still visible), then purge
  expiresAt: { type: Date, required: true, expires: 60 * 60 * 24 },
  revokedAt: { type: Date, default: null },
  lastUsedAt: { type: Date },
}, { timestamps: true });

export default mongoose.model<AgentSession>('AgentSession', AgentSessionSchema);
