import mongoose from 'mongoose';
import { config } from '../config.js';

export const connectTestDB = async () => {
  const mongoUri = config.mongoUri;
  // Ensure the test database name always ends with '_test'
  const testDbName = config.dbName.toLowerCase().endsWith('test') 
    ? config.dbName 
    : `${config.dbName}_test`;
    
  // Force disconnect if already connected to a non-test database
  if (mongoose.connection.readyState !== 0) {
    const currentDb = mongoose.connection.name;
    if (!currentDb.toLowerCase().includes('test')) {
      console.warn(`CRITICAL: Disconnecting from potential production/dev database: ${currentDb}`);
      await mongoose.disconnect();
    } else {
      // Already connected to a test database, but let's make sure it's the right one
      if (mongoose.connection.name !== testDbName) {
        await mongoose.disconnect();
      } else {
        return;
      }
    }
  }

  await mongoose.connect(mongoUri, {
    dbName: testDbName
  });
  console.log(`Tests connected to database: ${mongoose.connection.name}`);
};

export const clearTestDB = async () => {
  const dbName = mongoose.connection.name;
  if (!dbName.toLowerCase().includes('test')) {
    throw new Error(`SAFETY TRIGGERED: Refusing to clear database "${dbName}" because it does not contain "test" in its name.`);
  }

  const collections = await mongoose.connection.db?.listCollections().toArray();
  if (collections) {
    for (const collection of collections) {
      await mongoose.connection.db?.collection(collection.name).deleteMany({});
    }
  }
};

export const closeTestDB = async () => {
  await mongoose.connection.close();
};
