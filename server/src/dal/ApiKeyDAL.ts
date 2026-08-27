import ApiKey, { ApiKey as ApiKeyType } from '../models/ApiKey.js';

export class ApiKeyDAL {
  static async findOne(query: any) {
    return await ApiKey.findOne(query);
  }

  static async findById(id: string) {
    return await ApiKey.findById(id);
  }

  static async find(query: any = {}) {
    return await ApiKey.find(query);
  }

  static async create(data: Partial<ApiKeyType>) {
    const apiKey = new ApiKey(data);
    return await apiKey.save();
  }

  static async updateOne(filter: any, update: any) {
    return await ApiKey.updateOne(filter, update);
  }

  static async deleteOne(filter: any) {
    return await ApiKey.deleteOne(filter);
  }
}
