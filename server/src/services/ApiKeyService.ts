import crypto from 'crypto';
import { ApiKeyDAL } from '../dal/ApiKeyDAL.js';
import { ApiKey as ApiKeyType } from '../models/ApiKey.js';

export class ApiKeyService {
  private static readonly KEY_PREFIX = 'sk_live_';

  static generateRawKey(): string {
    return `${this.KEY_PREFIX}${crypto.randomBytes(24).toString('hex')}`;
  }

  static computeHash(key: string): string {
    return crypto.createHash('sha256').update(key).digest('hex');
  }

  static extractPrefix(key: string): string {
    // Format: sk_live_xxxxx... (prefix = sk_live_ + first 8 chars)
    const parts = key.split('_');
    if (parts.length >= 3) {
      return `${parts[0]}_${parts[1]}_${parts[2].substring(0, 8)}...`;
    }
    return key.substring(0, 16) + '...';
  }

  static async create(userId: string, name: string, scopes: string[] = ['read:tasks']) {
    const rawKey = this.generateRawKey();
    const keyHash = this.computeHash(rawKey);
    const prefix = this.extractPrefix(rawKey);

    const validScopes = (scopes as any).filter((s: string) => 
      ['read:tasks', 'write:tasks', 'read:features', 'read:epics'].includes(s)
    );

    const apiKey = await ApiKeyDAL.create({
      name,
      keyHash,
      prefix,
      scopes: validScopes.length > 0 ? validScopes : ['read:tasks', 'read:features', 'read:epics', 'write:tasks'],
      isActive: true,
      createdByUserId: userId as any,
    });

    // Return both the raw key (one-time) and the saved record
    return {
      apiKey: rawKey,
      prefix,
      name: apiKey.name,
      id: apiKey._id.toString(),
    };
  }

  static async listByUserId(userId: string) {
    const keys = await ApiKeyDAL.find({
      createdByUserId: userId,
    });

    return keys.map((key: ApiKeyType) => ({
      id: key._id?.toString(),
      name: key.name,
      prefix: key.prefix,
      scopes: key.scopes,
      isActive: key.isActive,
      createdAt: key.createdAt,
      lastUsedAt: key.lastUsedAt,
    }));
  }

  static async revokeById(userId: string, keyId: string) {
    // Verify ownership before revoking
    const key = await ApiKeyDAL.findById(keyId);
    if (!key) {
      throw new Error('API key not found');
    }

    if (key.createdByUserId.toString() !== userId) {
      throw new Error('Unauthorized: Cannot revoke key belonging to another user');
    }

    await ApiKeyDAL.updateOne({ _id: keyId }, { isActive: false });
  }
}
