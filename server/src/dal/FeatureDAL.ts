import mongoose from 'mongoose';
import Feature, { Feature as FeatureType } from '../models/Feature.js';
import { Status } from '../models/Epic.js';

export class FeatureDAL {
  static async find(filters: any = {}, select: any = null) {
    let query = Feature.find(filters);
    if (select) {
      query = query.select(select);
    }
    return await query;
  }

  static async findWithProgress(filters: { epicId?: string } = {}) {
    const match: any = {};
    if (filters.epicId) {
      match.epicId = new mongoose.Types.ObjectId(filters.epicId);
    }

    return await Feature.aggregate([
      { $match: match },
      {
        $lookup: {
          from: 'epics',
          localField: 'epicId',
          foreignField: '_id',
          as: 'epic',
        },
      },
      { $unwind: '$epic' },
      {
        $lookup: {
          from: 'userstories',
          localField: '_id',
          foreignField: 'featureId',
          as: 'userStories',
        },
      },
      {
        $addFields: {
          epicTitle: '$epic.title',
          userStoryCount: { $size: '$userStories' },
          totalStoryPoints: { $sum: '$userStories.storyPoints' },
          completedStoryPoints: {
            $sum: {
              $map: {
                input: '$userStories',
                as: 'story',
                in: {
                  $cond: [{ $eq: ['$$story.status', 'Done'] }, '$$story.storyPoints', 0],
                },
              },
            },
          },
        },
      },
      {
        $project: {
          epic: 0,
          userStories: 0,
        },
      },
      { $sort: { updatedAt: -1 } }
    ]);
  }

  static async findById(id: string) {
    return await Feature.findById(id);
  }

  static async create(data: Partial<FeatureType>) {
    const feature = new Feature(data);
    return await feature.save();
  }

  static async update(id: string, data: Partial<FeatureType>) {
    return await Feature.findByIdAndUpdate(id, data, { new: true });
  }

  static async updateStatus(id: string, status: Status) {
    return await Feature.findByIdAndUpdate(id, { status }, { new: true });
  }

  static async delete(id: string) {
    return await Feature.findByIdAndDelete(id);
  }
}
