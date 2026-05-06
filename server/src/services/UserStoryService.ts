import { UserStoryDAL } from '../dal/UserStoryDAL.js';
import { UserStory as UserStoryType } from '../models/UserStory.js';
import { StatusService } from './StatusService.js';

export class UserStoryService {
  static async getAll(filters: any = {}) {
    return await UserStoryDAL.find(filters);
  }

  static async create(data: Partial<UserStoryType>) {
    const story = await UserStoryDAL.create(data);
    
    if (story.status === 'In Progress') {
      await StatusService.handleUserStoryStatusChange(story._id.toString(), story.status);
    }
    
    return story;
  }

  static async update(id: string, data: Partial<UserStoryType>) {
    const oldStory = await UserStoryDAL.findById(id);
    if (!oldStory) return null;

    const updatedStory = await UserStoryDAL.update(id, data);
    if (!updatedStory) return null;

    if (data.status && data.status !== oldStory.status) {
      await StatusService.handleUserStoryStatusChange(id, data.status);
    }

    return updatedStory;
  }

  static async delete(id: string) {
    return await UserStoryDAL.delete(id);
  }
}
