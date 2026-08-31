import mongoose from 'mongoose';
import ApiKey, { ApiKey as ApiKeyType } from '../models/ApiKey.js';

export class ApiKeyDAL {
  static async findByKey(key: string) {
    return await ApiKey.findOne({ key }).populate('userId');
  }

  static async findByUserId(userId: string) {
    const objectId = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : userId;
    return await ApiKey.findOne({ userId: objectId }).sort({ createdAt: -1 });
  }

  static async create(data: Partial<ApiKeyType>) {
    const apiKey = new ApiKey(data);
    return await apiKey.save();
  }

  static async deleteByUserId(userId: string) {
    const objectId = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : userId;
    return await ApiKey.deleteMany({ userId: objectId });
  }

  static async deleteById(id: string) {
    return await ApiKey.findByIdAndDelete(id);
  }

  static async updateLastUsed(id: string, lastUsedAt: Date = new Date()) {
    return await ApiKey.findByIdAndUpdate(id, { lastUsedAt }, { new: true });
  }
}
