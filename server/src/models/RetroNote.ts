import mongoose, { Schema, Document } from 'mongoose';

export const RETRO_NOTE_CATEGORIES = ['Keep', 'Improve', 'Note'] as const;
export type RetroNoteCategory = (typeof RETRO_NOTE_CATEGORIES)[number];

export type RetroNote = Document & {
    title: string;
    description: string;
    category: RetroNoteCategory;
    sprintId: mongoose.Types.ObjectId;
    authorId: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
};

const RetroNoteSchema: Schema = new Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: { type: String, enum: RETRO_NOTE_CATEGORIES, default: 'Note', required: true, trim: true },
    sprintId: { type: Schema.Types.ObjectId, ref: 'Sprint', required: true, index: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
}, { timestamps: true });

export default mongoose.model<RetroNote>('RetroNote', RetroNoteSchema);
