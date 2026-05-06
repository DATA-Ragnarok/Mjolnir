import UserStory, { UserStory as UserStoryType } from '../models/UserStory.js';

export class UserStoryDAL {
  static async find(filters: any = {}) {
    return await UserStory.find(filters);
  }

  static async findById(id: string) {
    return await UserStory.findById(id);
  }

  static async create(data: Partial<UserStoryType>) {
    const story = new UserStory(data);
    return await story.save();
  }

  static async update(id: string, data: Partial<UserStoryType>) {
    return await UserStory.findByIdAndUpdate(id, data, { new: true });
  }

  static async delete(id: string) {
    return await UserStory.findByIdAndDelete(id);
  }

  static async updateMany(filter: any, update: any) {
    return await UserStory.updateMany(filter, update);
  }

  static async migrateIncompleteStories(oldSprintId: string, newSprintId: string | null) {
    return await UserStory.updateMany(
      { sprintId: oldSprintId, status: { $ne: 'Done' } },
      { $set: { sprintId: newSprintId } }
    );
  }
}
