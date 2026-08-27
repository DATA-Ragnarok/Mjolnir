import Epic, { Epic as EpicType, Status } from '../models/Epic.js';

export class EpicDAL {
  static async find(filters: any = {}, select: any = null) {
    let query = Epic.find(filters);
    if (select) {
      query = query.select(select);
    }
    return await query;
  }

  static async findAll() {
    return await Epic.find();
  }

  static async findAllWithProgress() {
    return await Epic.aggregate([
      {
        $lookup: {
          from: 'features',
          localField: '_id',
          foreignField: 'epicId',
          as: 'features',
        },
      },
      {
        $lookup: {
          from: 'userstories',
          localField: 'features._id',
          foreignField: 'featureId',
          as: 'userStories',
        },
      },
      {
        $addFields: {
          featureCount: { $size: '$features' },
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
          features: 0,
          userStories: 0,
        },
      },
    ]);
  }

  static async findById(id: string) {
    return await Epic.findById(id);
  }

  static async create(data: Partial<EpicType>) {
    const epic = new Epic(data);
    return await epic.save();
  }

  static async update(id: string, data: Partial<EpicType>) {
    return await Epic.findByIdAndUpdate(id, data, { new: true });
  }

  static async updateStatus(id: string, status: Status) {
    return await Epic.findByIdAndUpdate(id, { status }, { new: true });
  }

  static async delete(id: string) {
    return await Epic.findByIdAndDelete(id);
  }
}
