import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { config } from '../config.js';
import { AgentAuthDAL } from '../dal/AgentAuthDAL.js';
import { UserService } from './UserService.js';
import { AppError } from '../middleware/errorHandler.js';
import { User as UserType } from '../models/User.js';

export const AGENT_TOKEN_TTL_SECONDS = 8 * 60 * 60;
export const DEVICE_CODE_TTL_SECONDS = 10 * 60;
export const DEVICE_POLL_INTERVAL_SECONDS = 3;

// No 0/O/1/I/L to keep the code readable
const USER_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

type AgentTokenPayload = { sub: string; typ: 'agent'; jti: string };

export type PollResult =
  | { status: 'pending' }
  | { status: 'expired' }
  | { status: 'denied' }
  | { status: 'approved'; token: string; expiresAt: Date };

const hash = (value: string) => crypto.createHash('sha256').update(value).digest('hex');

const generateUserCode = (): string => {
  const chars: string[] = [];
  const bytes = crypto.randomBytes(8);
  for (const b of bytes) chars.push(USER_CODE_ALPHABET[b % USER_CODE_ALPHABET.length] as string);
  return `${chars.slice(0, 4).join('')}-${chars.slice(4).join('')}`;
};

const normalizeUserCode = (code: unknown): string => {
  if (typeof code !== 'string') return '';
  const clean = code.toUpperCase().replace(/[^A-Z0-9]/g, '');
  return clean.length === 8 ? `${clean.slice(0, 4)}-${clean.slice(4)}` : '';
};

export class AgentAuthService {
  static async startDeviceAuth() {
    const deviceCode = crypto.randomBytes(32).toString('hex');
    const userCode = generateUserCode();
    const expiresAt = new Date(Date.now() + DEVICE_CODE_TTL_SECONDS * 1000);

    await AgentAuthDAL.createDeviceAuth({
      deviceCodeHash: hash(deviceCode),
      userCode,
      expiresAt,
    });

    const verifyUrl = `${config.frontendUrl.replace(/\/$/, '')}/agent/auth?code=${userCode}`;
    return {
      deviceCode,
      userCode,
      verifyUrl,
      expiresIn: DEVICE_CODE_TTL_SECONDS,
      interval: DEVICE_POLL_INTERVAL_SECONDS,
    };
  }

  static async pollToken(deviceCode: unknown): Promise<PollResult> {
    if (typeof deviceCode !== 'string' || !deviceCode) {
      throw new AppError(400, 'deviceCode is required');
    }
    const doc = await AgentAuthDAL.findDeviceByHash(hash(deviceCode));
    if (!doc || doc.expiresAt < new Date() || doc.consumed) return { status: 'expired' };
    if (doc.status === 'denied') return { status: 'denied' };
    if (doc.status === 'pending' || !doc.userId) return { status: 'pending' };

    const consumed = await AgentAuthDAL.consumeDevice(doc._id.toString());
    if (!consumed) return { status: 'expired' };

    const jti = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + AGENT_TOKEN_TTL_SECONDS * 1000);
    await AgentAuthDAL.createSession({ jti, userId: doc.userId, expiresAt });

    const payload: AgentTokenPayload = { sub: doc.userId.toString(), typ: 'agent', jti };
    const token = jwt.sign(payload, config.jwtSecret, { expiresIn: AGENT_TOKEN_TTL_SECONDS });
    return { status: 'approved', token, expiresAt };
  }

  static async checkUserCode(code: unknown): Promise<boolean> {
    const userCode = normalizeUserCode(code);
    if (!userCode) return false;
    return !!(await AgentAuthDAL.findPendingByUserCode(userCode));
  }

  static async decide(code: unknown, userId: string, approve: boolean) {
    const userCode = normalizeUserCode(code);
    const doc = userCode ? await AgentAuthDAL.findPendingByUserCode(userCode) : null;
    if (!doc) throw new AppError(404, 'Invalid or expired code');
    const updated = await AgentAuthDAL.setDeviceStatus(doc._id.toString(), approve ? 'approved' : 'denied', userId);
    if (!updated) throw new AppError(404, 'Invalid or expired code');
  }

  /** Verifies an agent JWT. Returns the user and session id, or null if invalid. */
  static async validateAgentToken(token: string): Promise<{ user: UserType; jti: string } | null> {
    let decoded: AgentTokenPayload;
    try {
      decoded = jwt.verify(token, config.jwtSecret) as AgentTokenPayload;
    } catch {
      return null;
    }
    if (decoded.typ !== 'agent' || !decoded.jti || !decoded.sub) return null;

    const session = await AgentAuthDAL.findSessionByJti(decoded.jti);
    if (!session || session.revokedAt || session.expiresAt < new Date()) return null;
    if (session.userId.toString() !== decoded.sub) return null;

    const user = await UserService.findById(decoded.sub);
    if (!user) return null;

    await AgentAuthDAL.touchSession(decoded.jti);
    return { user, jti: decoded.jti };
  }

  static async revokeToken(jti: string) {
    await AgentAuthDAL.revokeByJti(jti);
  }

  static async listSessions(userId: string) {
    return await AgentAuthDAL.listActiveSessions(userId);
  }

  static async revokeSession(id: string, userId: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError(400, 'Invalid session id');
    await AgentAuthDAL.revokeSessionForUser(id, userId);
  }
}
