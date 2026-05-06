import { EpicDAL } from '../dal/EpicDAL.js';
import { FeatureDAL } from '../dal/FeatureDAL.js';
import { UserStoryDAL } from '../dal/UserStoryDAL.js';

export class StatusService {
  static async handleUserStoryStatusChange(userStoryId: string, newStatus: string) {
    try {
      const userStory = await UserStoryDAL.findById(userStoryId);
      if (!userStory) return;

      const feature = await FeatureDAL.findById(userStory.featureId.toString());
      if (!feature) return;

      // 1. Activation: IF UserStory.status changes to 'In Progress', SET parent Feature.status AND grandparent Epic.status to 'In Progress'.
      if (newStatus === 'In Progress') {
        if (feature.status !== 'In Progress' && feature.status !== 'Done') {
          await FeatureDAL.updateStatus(feature._id.toString(), 'In Progress');
          
          const epic = await EpicDAL.findById(feature.epicId.toString());
          if (epic && epic.status !== 'In Progress' && epic.status !== 'Done') {
            await EpicDAL.updateStatus(epic._id.toString(), 'In Progress');
          }
        }
      }

      // 2. Completion: IF all UserStories belonging to a Feature are 'Done', SET Feature.status to 'Done'.
      if (newStatus === 'Done') {
        const otherStories = await UserStoryDAL.find({ featureId: userStory.featureId, _id: { $ne: userStoryId } });
        const allDone = otherStories.every((s: any) => s.status === 'Done');
        
        if (allDone) {
          await FeatureDAL.updateStatus(feature._id.toString(), 'Done');
        }
      }
    } catch (error) {
      console.error('Error in Status Inheritance:', error);
    }
  }
}
