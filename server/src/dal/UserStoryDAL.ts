import UserStory, { UserStory as UserStoryType } from '../models/UserStory.js';

export class UserStoryDAL {
  static async find(filters: any = {}) {
    return await UserStory.find(filters).populate('assignedUser');
  }

  static async findById(id: string) {
    return await UserStory.findById(id).populate('assignedUser');
  }

  static async create(data: Partial<UserStoryType>) {
    const story = new UserStory(data);
    const saved = await story.save();
    return await saved.populate('assignedUser');
  }

  static async update(id: string, data: Partial<UserStoryType>) {
    return await UserStory.findByIdAndUpdate(id, data, { new: true }).populate('assignedUser');
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

  static async findWithPopulate(filters: any = {}) {
    return await UserStory.find(filters).populate('assignedUser');
  }
}
