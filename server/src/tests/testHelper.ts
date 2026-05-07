import mongoose from 'mongoose';
import { config } from '../config.js';

export const connectTestDB = async () => {
  const mongoUri = config.mongoUri.includes('_test') 
    ? config.mongoUri 
    : `${config.mongoUri}_test`;
    
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri);
  }
};

export const clearTestDB = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
};

export const closeTestDB = async () => {
  await mongoose.connection.close();
};
