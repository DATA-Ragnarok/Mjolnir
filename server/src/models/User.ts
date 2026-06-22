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

// Add virtual property 'id' that maps to '_id' for cleaner API
UserSchema.virtual('id').get(function(this: any) {
  return this._id.toString();
});

// Ensure virtuals are included when converting to JSON
UserSchema.set('toJSON', { virtuals: true });

export default mongoose.model<User>('User', UserSchema);
