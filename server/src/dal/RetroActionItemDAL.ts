import RetroActionItem, { RetroActionItemStatus } from '../models/RetroActionItem.js';

type RetroActionItemInput = {
  content: string;
  sprintId: string;
  status: RetroActionItemStatus;
  slot: number;
};

export class RetroActionItemDAL {
  static async findBySprintId(sprintId: string) {
    return await RetroActionItem.find({ sprintId }).sort({ slot: 1 });
  }

  static async replaceSprintItems(data: RetroActionItemInput[]) {
    const sprintId = data[0]?.sprintId;
    if (!sprintId) {
      return [];
    }

    await RetroActionItem.deleteMany({ sprintId });
    return await RetroActionItem.insertMany(data);
  }
}
