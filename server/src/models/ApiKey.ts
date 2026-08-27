import mongoose, { Schema, Document } from 'mongoose';

export type ApiKey = Document & {
  name: string;
  keyHash: string;
  prefix: string;
  scopes: ('read:tasks' | 'write:tasks' | 'read:features' | 'read:epics')[];
  isActive: boolean;
  createdByUserId: mongoose.Types.ObjectId;
  lastUsedAt?: Date;
  createdAt: Date;
};

const ApiKeySchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    keyHash: { type: String, required: true, unique: true },
    prefix: { type: String, required: true, index: true },
    scopes: {
      type: [{ type: String, enum: ['read:tasks', 'write:tasks', 'read:features', 'read:epics'] }],
      default: ['read:tasks', 'read:features', 'read:epics', 'write:tasks'],
    },
    isActive: { type: Boolean, default: true },
    createdByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    lastUsedAt: { type: Date },
  },
  { timestamps: true }
);

// Compound index for user lookups
ApiKeySchema.index({ createdByUserId: 1, isActive: 1 });

ApiKeySchema.virtual('id').get(function (this: any) {
  return this._id.toString();
});

ApiKeySchema.set('toJSON', { virtuals: true });

export default mongoose.model<ApiKey>('ApiKey', ApiKeySchema);
