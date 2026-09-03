import RetroNote from '../models/RetroNote.js';

type RetroNoteCreateInput = {
  title: string;
  description: string;
  sprintId: string;
  authorId: string;
};

type RetroNoteUpdateInput = {
  title?: string;
  description?: string;
  sprintId?: string;
};

export class RetroNoteDAL {
  static async findBySprintId(sprintId: string) {
    return await RetroNote.find({ sprintId })
      .populate('authorId', 'name email')
      .sort({ createdAt: -1 });
  }

  static async create(data: RetroNoteCreateInput) {
    const note = new RetroNote(data);
    return await note.save();
  }

  static async update(id: string, data: RetroNoteUpdateInput) {
    return await RetroNote.findByIdAndUpdate(id, data, { new: true })
      .populate('authorId', 'name email');
  }

  static async delete(id: string) {
    return await RetroNote.findByIdAndDelete(id);
  }
}
