import crypto from 'crypto';
import mongoose from 'mongoose';
import { ApiKeyDAL } from '../dal/ApiKeyDAL.js';
import { User as UserType } from '../models/User.js';

export class ApiKeyService {
  static generateKeyString(): string {
    const randomHex = crypto.randomBytes(24).toString('hex');
    return `mj_live_${randomHex}`;
  }

  static async getApiKeyForUser(userId: string) {
    return await ApiKeyDAL.findByUserId(userId);
  }

  static async createOrRegenerateApiKey(userId: string, name: string = 'Agent Integration Key') {
    // Delete existing keys for user
    await ApiKeyDAL.deleteByUserId(userId);

    const key = this.generateKeyString();
    return await ApiKeyDAL.create({
      key,
      userId: new mongoose.Types.ObjectId(userId) as any,
      name
    });
  }

  static async validateApiKey(key: string): Promise<UserType | null> {
    if (!key || !key.startsWith('mj_live_')) {
      return null;
    }

    const apiKeyDoc = await ApiKeyDAL.findByKey(key);
    if (!apiKeyDoc) {
      return null;
    }

    if (apiKeyDoc.expiresAt && apiKeyDoc.expiresAt < new Date()) {
      return null;
    }

    // Update lastUsedAt in background
    await ApiKeyDAL.updateLastUsed(apiKeyDoc._id.toString(), new Date());

    const user = apiKeyDoc.userId as unknown as UserType;
    return user || null;
  }
}
