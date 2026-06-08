import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env['PORT'] || '5001', 10),
  mongoUri: process.env['MONGODB_URI'] || 'mongodb://localhost:27017/mjolnir',
  dbName: process.env['DB_NAME'] || 'mjolnir',
  jwtSecret: process.env['JWT_SECRET'] || 'secret',
  frontendUrl: process.env['FRONTEND_URL'] || 'http://localhost:5173',
  googleClientId: process.env['GOOGLE_CLIENT_ID'],
};

// Validate critical config
if (!config.googleClientId && process.env['NODE_ENV'] === 'production') {
  console.warn('WARNING: GOOGLE_CLIENT_ID is not set in production');
}
