import mongoose, { Schema, Document } from 'mongoose';

export type Status = 'To Do' | 'In Progress' | 'Blocked' | 'Done';

export type Epic = Document & {
  title: string;
  description?: string;
  status: Status;
};

const EpicSchema: Schema = new Schema({
  title: { type: String, required: true },
  description: { type: String },
  status: { type: String, enum: ['To Do', 'In Progress', 'Blocked', 'Done'], default: 'To Do' },
}, { timestamps: true });

export default mongoose.model<Epic>('Epic', EpicSchema);
