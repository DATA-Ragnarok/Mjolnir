import { Response } from 'express';
import { User as UserType } from '../models/User.js';
import { McpSessionManager } from './mcp/sessionManager.js';
import { MCP_TOOLS } from './mcp/toolDefinitions.js';
import { McpToolExecutor } from './mcp/toolExecutor.js';
import { McpSession } from './mcp/types.js';

export type { McpSession };

export class McpServerService {
  static createSession(res: Response, user: UserType): string {
    return McpSessionManager.createSession(res, user);
  }

  static getSession(sessionId: string): McpSession | undefined {
    return McpSessionManager.getSession(sessionId);
  }

  static removeSession(sessionId: string) {
    McpSessionManager.removeSession(sessionId);
  }

  static sendSseEvent(sessionId: string, event: string, data: any) {
    McpSessionManager.sendSseEvent(sessionId, event, data);
  }

  static async handleJsonRpc(message: any, user: UserType, _sessionId?: string): Promise<any> {
    const { jsonrpc, id, method, params } = message || {};

    if (!jsonrpc || jsonrpc !== '2.0') {
      return {
        jsonrpc: '2.0',
        id: id ?? null,
        error: { code: -32600, message: 'Invalid Request: jsonrpc must be "2.0"' }
      };
    }

    try {
      switch (method) {
        case 'initialize': {
          return {
            jsonrpc: '2.0',
            id,
            result: {
              protocolVersion: '2024-11-05',
              capabilities: {
                tools: {}
              },
              serverInfo: {
                name: 'mjolnir-mcp-server',
                version: '1.0.0'
              }
            }
          };
        }

        case 'notifications/initialized': {
          return null;
        }

        case 'ping': {
          return {
            jsonrpc: '2.0',
            id,
            result: {}
          };
        }

        case 'tools/list': {
          return {
            jsonrpc: '2.0',
            id,
            result: {
              tools: MCP_TOOLS
            }
          };
        }

        case 'tools/call': {
          const { name, arguments: toolArgs = {} } = params || {};
          const toolResult = await McpToolExecutor.executeTool(name, toolArgs, user);
          return {
            jsonrpc: '2.0',
            id,
            result: {
              content: [
                {
                  type: 'text',
                  text: typeof toolResult === 'string' ? toolResult : JSON.stringify(toolResult)
                }
              ],
              isError: false
            }
          };
        }

        default: {
          return {
            jsonrpc: '2.0',
            id,
            error: { code: -32601, message: `Method not found: ${method}` }
          };
        }
      }
    } catch (error: any) {
      if (method === 'tools/call') {
        return {
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: error.message || 'Error executing tool'
              }
            ],
            isError: true
          }
        };
      }

      return {
        jsonrpc: '2.0',
        id,
        error: { code: -32000, message: error.message || 'Internal error' }
      };
    }
  }

  static async executeTool(name: string, args: any, user: UserType): Promise<any> {
    return McpToolExecutor.executeTool(name, args, user);
  }
}
