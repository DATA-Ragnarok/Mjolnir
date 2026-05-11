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
import { AppError } from './middleware/errorHandler.js';
import { SprintService } from './services/SprintService.js';

export const app = express();

app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Routes
app.use('/api/epics', epicRoutes);
app.use('/api/features', featureRoutes);
app.use('/api/user-stories', userStoryRoutes);
app.use('/api/sprints', sprintRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

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
