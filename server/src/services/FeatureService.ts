import { FeatureDAL } from '../dal/FeatureDAL.js';
import { Feature as FeatureType } from '../models/Feature.js';

export class FeatureService {
  static async getAll(filters: any = {}) {
    return await FeatureDAL.findWithProgress(filters);
  }

  static async create(data: Partial<FeatureType>) {
    return await FeatureDAL.create(data);
  }

  static async update(id: string, data: Partial<FeatureType>) {
    return await FeatureDAL.update(id, data);
  }

  static async delete(id: string) {
    return await FeatureDAL.delete(id);
  }
}
