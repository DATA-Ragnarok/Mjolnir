import Sprint, { Sprint as SprintType } from '../models/Sprint.js';

export class SprintDAL {
  static async findAll() {
    return await Sprint.find().sort({ startDate: 1 });
  }

  static async findById(id: string) {
    return await Sprint.findById(id);
  }

  static async findOne(query: any, sort: any = {}) {
    return await Sprint.findOne(query).sort(sort);
  }

  static async find(query: any) {
    return await Sprint.find(query);
  }

  static async findExpired(date: Date) {
    return await Sprint.find({ endDate: { $lt: date } });
  }

  static async findActive(now: Date = new Date()) {
    return await Sprint.findOne({
      startDate: { $lte: now },
      endDate: { $gte: now }
    }).sort({ startDate: 1 });
  }

  static async findNextSprint(endDate: Date) {
    return await Sprint.findOne({ startDate: { $gt: endDate } }).sort({ startDate: 1 });
  }

  static async create(data: Partial<SprintType>) {
    const sprint = new Sprint(data);
    return await sprint.save();
  }

  static async update(id: string, data: Partial<SprintType>) {
    return await Sprint.findByIdAndUpdate(id, data, { new: true });
  }

  static async delete(id: string) {
    return await Sprint.findByIdAndDelete(id);
  }
}
