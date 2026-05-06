import mongoose, { Schema, Document } from 'mongoose';

export type Sprint = Document & {
  name: string;
  startDate: Date;
  endDate: Date;
};

const SprintSchema: Schema = new Schema({
  name: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
}, { timestamps: true });

export default mongoose.model<Sprint>('Sprint', SprintSchema);
