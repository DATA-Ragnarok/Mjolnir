import { Request, Response } from 'express';
import { AgentAuthService } from '../services/AgentAuthService.js';
import { SkillService } from '../services/SkillService.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { config } from '../config.js';

export const startDeviceAuth = asyncHandler(async (_req: Request, res: Response) => {
  res.status(201).json(await AgentAuthService.startDeviceAuth());
});

export const pollToken = asyncHandler(async (req: Request, res: Response) => {
  const result = await AgentAuthService.pollToken(req.body?.deviceCode);
  switch (result.status) {
    case 'pending':
      return res.status(202).json({ status: 'authorization_pending' });
    case 'approved':
      return res.json({ token: result.token, expiresAt: result.expiresAt });
    case 'denied':
      return res.status(410).json({ status: 'denied', message: 'The user denied the request' });
    default:
      return res.status(410).json({ status: 'expired', message: 'The code expired or was already used' });
  }
});

export const lookupCode = asyncHandler(async (req: Request, res: Response) => {
  const valid = await AgentAuthService.checkUserCode(req.query['code']);
  res.json({ valid });
});

export const approveCode = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  await AgentAuthService.decide(req.body?.code, req.user._id.toString(), true);
  res.json({ status: 'approved' });
});

export const denyCode = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  await AgentAuthService.decide(req.body?.code, req.user._id.toString(), false);
  res.json({ status: 'denied' });
});

export const revokeCurrentToken = asyncHandler(async (req: Request, res: Response) => {
  if (!req.agentJti) throw new AppError(400, 'Only agent tokens can be revoked here');
  await AgentAuthService.revokeToken(req.agentJti);
  res.json({ status: 'revoked' });
});

export const listSessions = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  const sessions = await AgentAuthService.listSessions(req.user._id.toString());
  res.json(sessions.map((s) => ({
    id: s._id,
    name: s.name,
    createdAt: s.createdAt,
    lastUsedAt: s.lastUsedAt,
    expiresAt: s.expiresAt,
  })));
});

export const revokeSession = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  await AgentAuthService.revokeSession(req.params['id'] as string, req.user._id.toString());
  res.json({ status: 'revoked' });
});

export const getSkills = asyncHandler(async (req: Request, res: Response) => {
  const name = typeof req.query['name'] === 'string' ? req.query['name'] : undefined;
  const { skills, etag } = SkillService.getSkills(name);
  res.setHeader('ETag', etag);
  if (req.headers['if-none-match'] === etag) return res.status(304).end();
  res.json({ skills });
});

export const getBootstrapSkill = asyncHandler(async (req: Request, res: Response) => {
  const baseUrl = config.publicUrl || `${req.protocol}://${req.get('host')}`;
  res.type('text/markdown').setHeader('Content-Disposition', 'attachment; filename="mjolnir-agent-skill.md"');
  res.send(SkillService.getBootstrapSkill(baseUrl));
});
