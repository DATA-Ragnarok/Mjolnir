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
  properties: Record<string, unknown>;
  required?: string[];
};

export type McpToolDefinition = {
  name: string;
  description: string;
  inputSchema: ToolInputSchema;
};

export type UserStorySummaryDTO = {
  _id: string;
  title: string;
  status: string;
  storyPoints: number;
  featureId: string;
  sprintId?: string;
  assignedUser?: string;
};

export type UserStoryDetailDTO = {
  _id: string;
  title: string;
  description: string;
  storyPoints: number;
  status: string;
  featureId: string;
  sprintId?: string;
  assignedUser?: string | { _id: string; name?: string; email?: string };
};

export type FeatureSummaryDTO = {
  _id: string;
  title: string;
  status: string;
  epicId: string;
};

export type EpicSummaryDTO = {
  _id: string;
  title: string;
  status: string;
};

export type SprintSummaryDTO = {
  _id: string;
  name: string;
  startDate: Date;
  endDate: Date;
};

export type TeamMemberDTO = {
  _id: string;
  name: string;
  email: string;
};

export type UserProfileDTO = {
  _id: string;
  name: string;
  email: string;
  isAdmin: boolean;
};

export type JsonRpcRequest = {
  jsonrpc: string;
  id?: string | number | null;
  method: string;
  params?: {
    name?: string;
    arguments?: Record<string, unknown>;
    [key: string]: unknown;
  };
};

export type JsonRpcResponse = {
  jsonrpc: '2.0';
  id: string | number | null;
  result?: {
    content?: Array<{ type: string; text: string }>;
    tools?: McpToolDefinition[];
    isError?: boolean;
    protocolVersion?: string;
    capabilities?: Record<string, unknown>;
    serverInfo?: { name: string; version: string };
    [key: string]: unknown;
  };
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
};
