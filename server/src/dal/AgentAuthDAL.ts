import mongoose from 'mongoose';
import DeviceAuth, { DeviceAuth as DeviceAuthType } from '../models/DeviceAuth.js';
import AgentSession, { AgentSession as AgentSessionType } from '../models/AgentSession.js';

const toObjectId = (id: string) => new mongoose.Types.ObjectId(id);

export class AgentAuthDAL {
  // ---- Device codes ----
  static async createDeviceAuth(data: Partial<DeviceAuthType>) {
    return await new DeviceAuth(data).save();
  }

  static async findDeviceByHash(deviceCodeHash: string) {
    return await DeviceAuth.findOne({ deviceCodeHash });
  }

  static async findPendingByUserCode(userCode: string) {
    return await DeviceAuth.findOne({
      userCode,
      status: 'pending',
      expiresAt: { $gt: new Date() },
    });
  }

  static async setDeviceStatus(id: string, status: 'approved' | 'denied', userId: string) {
    return await DeviceAuth.findOneAndUpdate(
      { _id: id, status: 'pending' },
      { status, userId: toObjectId(userId) },
      { new: true }
    );
  }

  /** Atomically marks an approved device code as consumed. Returns null if already consumed. */
  static async consumeDevice(id: string) {
    return await DeviceAuth.findOneAndUpdate(
      { _id: id, status: 'approved', consumed: false },
      { consumed: true },
      { new: true }
    );
  }

  // ---- Sessions ----
  static async createSession(data: Partial<AgentSessionType>) {
    return await new AgentSession(data).save();
  }

  static async findSessionByJti(jti: string) {
    return await AgentSession.findOne({ jti });
  }

  static async touchSession(jti: string) {
    return await AgentSession.updateOne({ jti }, { lastUsedAt: new Date() });
  }

  static async revokeByJti(jti: string) {
    return await AgentSession.updateOne({ jti, revokedAt: null }, { revokedAt: new Date() });
  }

  static async listActiveSessions(userId: string) {
    return await AgentSession.find({
      userId: toObjectId(userId),
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });
  }

  static async revokeSessionForUser(id: string, userId: string) {
    return await AgentSession.updateOne(
      { _id: id, userId: toObjectId(userId), revokedAt: null },
      { revokedAt: new Date() }
    );
  }
}
