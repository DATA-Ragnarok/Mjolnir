import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { UserDAL } from '../dal/UserDAL.js';
import { EpicDAL } from '../dal/EpicDAL.js';
import { FeatureDAL } from '../dal/FeatureDAL.js';
import { UserStoryDAL } from '../dal/UserStoryDAL.js';
import { SprintDAL } from '../dal/SprintDAL.js';
import jwt from 'jsonwebtoken';

dotenv.config();

const seed = async () => {
  try {
    const mongoUri = process.env['MONGODB_URI'] || 'mongodb://localhost:27017/mjolnir';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Clear existing data
    await mongoose.connection.dropDatabase();
    console.log('Cleared database');

    // 1. Create User
    const user = await UserDAL.create({
      googleId: 'test-google-id',
      email: 'test@example.com',
      name: 'Test User',
      isApproved: true,
      isAdmin: true,
    });
    console.log('Created User');

    // 2. Create Epics
    const epic1 = await EpicDAL.create({
      title: 'Foundation Epic',
      description: 'Building the core system',
      status: 'To Do',
    });
    const epic2 = await EpicDAL.create({
      title: 'UI Polish Epic',
      description: 'Making it look great',
      status: 'To Do',
    });
    console.log('Created Epics');

    // 3. Create Features
    const feature1 = await FeatureDAL.create({
      title: 'Auth System',
      description: 'Google OAuth implementation',
      status: 'To Do',
      epicId: epic1._id as any,
    });
    const feature2 = await FeatureDAL.create({
      title: 'Dashboard UI',
      description: 'Main landing page',
      status: 'To Do',
      epicId: epic2._id as any,
    });
    console.log('Created Features');

    // 4. Create Sprints
    const now = new Date();
    const sprint1 = await SprintDAL.create({
      name: 'Sprint 1',
      startDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // Started 1 week ago
      endDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),   // Ends in 1 week
    });
    const sprint2 = await SprintDAL.create({
      name: 'Sprint 2',
      startDate: new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() + 22 * 24 * 60 * 60 * 1000),
    });
    console.log('Created Sprints');

    // 5. Create User Stories
    await UserStoryDAL.create({
      title: 'Setup Express Server',
      status: 'Done',
      storyPoints: 3,
      featureId: feature1._id as any,
      sprintId: sprint1._id as any,
    });
    await UserStoryDAL.create({
      title: 'Implement Middleware',
      status: 'In Progress',
      storyPoints: 5,
      featureId: feature1._id as any,
      sprintId: sprint1._id as any,
      assignedUserId: user._id as any,
    });
    await UserStoryDAL.create({
      title: 'Design Logo',
      status: 'To Do',
      storyPoints: 2,
      featureId: feature2._id as any,
    });
    console.log('Created User Stories');

    // Generate JWT for testing
    const token = jwt.sign({ userId: user._id }, process.env['JWT_SECRET'] || 'secret', { expiresIn: '7d' });
    console.log('\n--- SEED COMPLETE ---');
    console.log('User ID:', user._id);
    console.log('Test JWT:', token);
    console.log('----------------------\n');

    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
};

seed();
