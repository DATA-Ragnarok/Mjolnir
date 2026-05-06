import mongoose, { Schema, Document } from 'mongoose';
import { Status } from './Epic.js';

export type Feature = Document & {
  title: string;
  description?: string;
  status: Status;
  epicId: mongoose.Types.ObjectId;
};

const FeatureSchema: Schema = new Schema({
  title: { type: String, required: true },
  description: { type: String },
  status: { type: String, enum: ['To Do', 'In Progress', 'Blocked', 'Done'], default: 'To Do' },
  epicId: { type: Schema.Types.ObjectId, ref: 'Epic', required: true },
}, { timestamps: true });

export default mongoose.model<Feature>('Feature', FeatureSchema);
