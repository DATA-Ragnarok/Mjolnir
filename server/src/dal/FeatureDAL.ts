import Feature, { Feature as FeatureType } from '../models/Feature.js';
import { Status } from '../models/Epic.js';

export class FeatureDAL {
  static async find(filters: any = {}) {
    return await Feature.find(filters);
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
