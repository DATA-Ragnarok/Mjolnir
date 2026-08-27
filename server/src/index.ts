import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { config } from './config.js';
import epicRoutes from './routes/epicRoutes.js';
import featureRoutes from './routes/featureRoutes.js';
import userStoryRoutes from './routes/userStoryRoutes.js';
import sprintRoutes from './routes/sprintRoutes.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import apiKeyRoutes from './routes/apiKeyRoutes.js';
import agentRoutes from './routes/agentRoutes.js';
import openApiRoutes from './routes/openApiRoutes.js';
import mcpRoutes from './routes/mcpRoutes.js';
import { AppError } from './middleware/errorHandler.js';
import { SprintService } from './services/SprintService.js';

export const app = express();

app.use(cors({
  origin: (origin, callback) => {
    // Allow any origin (including Gemini Web, Claude Web, local frontend, tools)
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'x-api-key',
    'Accept',
    'Cache-Control',
    'X-Requested-With',
    'X-Accel-Buffering',
  ],
}));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Root endpoint handler: returns status & endpoints descriptor
app.get('/', (req, res) => {
  const acceptHeader = req.headers.accept || '';
  if (acceptHeader.includes('text/event-stream')) {
    return (mcpRoutes as any)(req, res);
  }
  const protocol = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'https';
  const host = (req.headers['x-forwarded-host'] as string) || req.get('host') || 'mjolnir-dev-server.onrender.com';
  const baseUrl = `${protocol}://${host}`;

  res.json({
    name: 'Mjolnir Remote MCP Server & Agent API',
    status: 'online',
    version: '1.0.0',
    mcp: {
      sse: `${baseUrl}/api/mcp/sse`,
      messages: `${baseUrl}/api/mcp/messages`,
    },
    openapi: {
      json: `${baseUrl}/api/openapi.json`,
      yaml: `${baseUrl}/api/openapi.yaml`,
    },
    health: `${baseUrl}/health`,
  });
});

// Remote MCP Server Routes (mounted at /api/mcp, /mcp, /sse, /api/sse, /messages, /api/messages)
app.use('/api/mcp', mcpRoutes);
app.use('/mcp', mcpRoutes);
app.use('/sse', mcpRoutes);
app.use('/api/sse', mcpRoutes);
app.use('/messages', mcpRoutes);
app.use('/api/messages', mcpRoutes);

// OpenAPI Spec Routes (mounted at root and /api)
app.use('/api', openApiRoutes);
app.use('/', openApiRoutes);

// Agent Routes (mounted with and without /api prefix)
app.use('/api/agent/tasks', agentRoutes);
app.use('/agent/tasks', agentRoutes);
app.use('/api/agent', agentRoutes);
app.use('/agent', agentRoutes);

// Standard App Routes
app.use('/api/epics', epicRoutes);
app.use('/api/features', featureRoutes);
app.use('/api/user-stories', userStoryRoutes);
app.use('/api/sprints', sprintRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/keys', apiKeyRoutes);

// 404 handler
app.use((req, res, next) => {
  next(new AppError(404, `Not Found - ${req.originalUrl}`));
});

// Global Error Handler
app.use((err: Error & { statusCode?: number; name?: string }, req: Request, res: Response, next: NextFunction) => {
  let statusCode = err.statusCode || 500;
  let message = err.message;

  if (err.name === 'ValidationError') {
    statusCode = 400;
  }

  res.status(statusCode).json({
    message,
    stack: process.env['NODE_ENV'] === 'production' ? null : err.stack,
  });
});

const startServer = async () => {
  try {
    await mongoose.connect(config.mongoUri, {
      dbName: config.dbName
    });
    console.log(`Connected to MongoDB database: ${config.dbName}`);
    
    if (process.env['NODE_ENV'] !== 'test') {
      app.listen(config.port, () => {
        console.log(`Server is running on port ${config.port}`);
      });
    }
  } catch (error) {
    console.error('Failed to connect to MongoDB', error);
    process.exit(1);
  }
};

if (process.env['NODE_ENV'] !== 'test') {
  startServer();
  
  // Periodic sprint migration check every hour
  setInterval(() => {
    SprintService.migrateExpiredSprints().catch(err => console.error('Sprint migration failed:', err));
  }, 1000 * 60 * 60);
}
