import crypto from 'crypto';
import { Response } from 'express';
import { User as UserType } from '../../models/User.js';
import { McpSession } from './types.js';

const sessions = new Map<string, McpSession>();

(global as any).__mcpGetSession = (sessionId: string) => sessions.get(sessionId);

export class McpSessionManager {
  static createSession(res: Response, user: UserType): string {
    const sessionId = crypto.randomUUID();
    sessions.set(sessionId, {
      sessionId,
      res,
      user,
      createdAt: new Date()
    });
    return sessionId;
  }

  static getSession(sessionId: string): McpSession | undefined {
    return sessions.get(sessionId);
  }

  static removeSession(sessionId: string) {
    sessions.delete(sessionId);
  }

  static sendSseEvent(sessionId: string, event: string, data: any) {
    const session = sessions.get(sessionId);
    if (session && !session.res.writableEnded) {
      session.res.write(`event: ${event}\ndata: ${typeof data === 'string' ? data : JSON.stringify(data)}\n\n`);
    }
  }
}
