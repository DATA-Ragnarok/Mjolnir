import mongoose, { Schema, Document } from 'mongoose';

export type DeviceAuthStatus = 'pending' | 'approved' | 'denied';

export type DeviceAuth = Document & {
  deviceCodeHash: string;
  userCode: string;
  status: DeviceAuthStatus;
  userId?: mongoose.Types.ObjectId;
  consumed: boolean;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

const DeviceAuthSchema: Schema = new Schema({
  deviceCodeHash: { type: String, required: true, unique: true, index: true },
  userCode: { type: String, required: true, index: true },
  status: { type: String, enum: ['pending', 'approved', 'denied'], default: 'pending' },
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  consumed: { type: Boolean, default: false },
  expiresAt: { type: Date, required: true, expires: 60 * 60 },
}, { timestamps: true });

export default mongoose.model<DeviceAuth>('DeviceAuth', DeviceAuthSchema);
