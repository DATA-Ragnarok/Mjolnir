import { Response } from 'express';
import { User as UserType } from '../../models/User.js';

export type McpSession = {
  sessionId: string;
  res: Response;
  user: UserType;
  createdAt: Date;
};

export type ToolInputSchema = {
  type: 'object';
  properties: Record<string, any>;
  required?: string[];
};

export type McpToolDefinition = {
  name: string;
  description: string;
  inputSchema: ToolInputSchema;
};
