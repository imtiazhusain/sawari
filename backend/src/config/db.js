import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';
export async function connectDb() {
  try {
    
    await mongoose.connect(env.MONGO_URI);
    logger.info("✅ Successfully connected to Database ");
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', err);
     process.exit(1);
  }
}
export async function disconnectDb() {
  await mongoose.disconnect();
}
