import mongoose, { Schema, Document } from 'mongoose';

export const RETRO_ACTION_ITEM_STATUSES = ['To Do', 'Done', 'Ignored'] as const;

export type RetroActionItemStatus = (typeof RETRO_ACTION_ITEM_STATUSES)[number];

export type RetroActionItem = Document & {
    content: string;
    sprintId: mongoose.Types.ObjectId;
    status: RetroActionItemStatus;
    slot: number;
    createdAt: Date;
    updatedAt: Date;
};

const RetroActionItemSchema: Schema = new Schema({
    content: { type: String, default: '', trim: true },
    sprintId: { type: Schema.Types.ObjectId, ref: 'Sprint', required: true, index: true },
    status: { type: String, enum: RETRO_ACTION_ITEM_STATUSES, default: 'To Do' },
    slot: { type: Number, required: true, min: 0, max: 2 },
}, { timestamps: true });

RetroActionItemSchema.index({ sprintId: 1, slot: 1 }, { unique: true });

export default mongoose.model<RetroActionItem>('RetroActionItem', RetroActionItemSchema);
