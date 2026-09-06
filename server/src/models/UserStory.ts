import mongoose, { Schema, Document } from 'mongoose';
import { User } from './User.js';

export type UserStoryStatus = 'To Do' | 'In Progress' | 'Blocked' | 'Waiting for MR' | 'Done';

export type UserStoryStatusHistoryEntry = {
  status: UserStoryStatus;
  changedAt: Date;
};

export type UserStory = Document & {
  title: string;
  description?: string;
  status: UserStoryStatus;
  statusHistory: UserStoryStatusHistoryEntry[];
  storyPoints: number;
  featureId: mongoose.Types.ObjectId;
  sprintId?: mongoose.Types.ObjectId;
  assignedUser?: mongoose.Types.ObjectId | User | null;
  createdAt: Date;
  updatedAt: Date;
};

const UserStorySchema: Schema = new Schema({
  title: { type: String, required: true },
  description: { type: String },
  status: { type: String, enum: ['To Do', 'In Progress', 'Blocked', 'Waiting for MR', 'Done'], default: 'To Do' },
  statusHistory: {
    type: [
      {
        status: {
          type: String,
          enum: ['To Do', 'In Progress', 'Blocked', 'Waiting for MR', 'Done'],
          required: true,
        },
        changedAt: { type: Date, required: true },
      },
    ],
    default: [],
  },
  storyPoints: { type: Number, required: true, default: 1 },
  featureId: { type: Schema.Types.ObjectId, ref: 'Feature', required: true },
  sprintId: { type: Schema.Types.ObjectId, ref: 'Sprint' },
  assignedUser: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

export default mongoose.model<UserStory>('UserStory', UserStorySchema);
