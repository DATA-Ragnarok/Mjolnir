import { SprintDAL } from '../dal/SprintDAL.js';
import { UserStoryDAL } from '../dal/UserStoryDAL.js';
import { Sprint as SprintType } from '../models/Sprint.js';

export class SprintService {
  static async getAll() {
    return await SprintDAL.findAll();
  }

  static async create(data: Partial<SprintType>) {
    return await SprintDAL.create(data);
  }

  static async update(id: string, data: Partial<SprintType>) {
    return await SprintDAL.update(id, data);
  }

  static async delete(id: string) {
    return await SprintDAL.delete(id);
  }

  static async migrateExpiredSprints() {
    try {
      const now = new Date();
      const expiredSprints = await SprintDAL.findExpired(now);

      for (const sprint of expiredSprints) {
        const nextSprint = await SprintDAL.findNextSprint(sprint.endDate);
        const nextSprintId = nextSprint ? nextSprint._id.toString() : null;
        
        await UserStoryDAL.migrateIncompleteStories(sprint._id.toString(), nextSprintId);
      }
    } catch (error) {
      console.error('Error migrating sprints:', error);
    }
  }
}
