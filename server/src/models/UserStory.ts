import mongoose, { Schema, Document } from 'mongoose';

export type UserStoryStatus = 'To Do' | 'In Progress' | 'Blocked' | 'Waiting for MR' | 'Done';

export type UserStory = Document & {
  title: string;
  description?: string;
  status: UserStoryStatus;
  storyPoints: number;
  featureId: mongoose.Types.ObjectId;
  sprintId?: mongoose.Types.ObjectId;
  assignedUserId?: mongoose.Types.ObjectId;
};

const UserStorySchema: Schema = new Schema({
  title: { type: String, required: true },
  description: { type: String },
  status: { type: String, enum: ['To Do', 'In Progress', 'Blocked', 'Waiting for MR', 'Done'], default: 'To Do' },
  storyPoints: { type: Number, required: true, default: 0 },
  featureId: { type: Schema.Types.ObjectId, ref: 'Feature', required: true },
  sprintId: { type: Schema.Types.ObjectId, ref: 'Sprint' },
  assignedUserId: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

export default mongoose.model<UserStory>('UserStory', UserStorySchema);
