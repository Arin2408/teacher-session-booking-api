import mongoose from 'mongoose';
import { env } from './env';

let connectionPromise: Promise<typeof mongoose> | null = null;

/**
 * Connects to MongoDB once and reuses the connection.
 * Safe to call on every request (needed for serverless deployments like Vercel).
 */
export const connectDB = async (): Promise<void> => {
  if (mongoose.connection.readyState === 1) return;

  if (!connectionPromise) {
    mongoose.set('strictQuery', true);
    connectionPromise = mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 10000 });
    connectionPromise
      .then(() => console.log(`MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`))
      .catch(() => {
        connectionPromise = null; // allow retry on the next request
      });
  }

  await connectionPromise;
};

export const disconnectDB = async (): Promise<void> => {
  await mongoose.connection.close();
  connectionPromise = null;
};
