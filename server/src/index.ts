import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import epicRoutes from './routes/epicRoutes.js';
import featureRoutes from './routes/featureRoutes.js';
import userStoryRoutes from './routes/userStoryRoutes.js';
import sprintRoutes from './routes/sprintRoutes.js';
import authRoutes from './routes/authRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
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

const startServer = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mjolnir';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');
    
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to connect to MongoDB', error);
    process.exit(1);
  }
};

startServer();
