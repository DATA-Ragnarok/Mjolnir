import { EpicDAL } from '../dal/EpicDAL.js';
import { Epic as EpicType } from '../models/Epic.js';

export class EpicService {
  static async getAll() {
    return await EpicDAL.findAllWithProgress();
  }

  static async create(data: Partial<EpicType>) {
    return await EpicDAL.create(data);
  }

  static async update(id: string, data: Partial<EpicType>) {
    return await EpicDAL.update(id, data);
  }

  static async delete(id: string) {
    return await EpicDAL.delete(id);
  }
}
