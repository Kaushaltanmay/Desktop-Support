import { MongoClient, Db } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const dbName = process.env.MONGODB_DB_NAME || 'desktop_support';

export const mongoClient = new MongoClient(uri);
let mongoDbInstance: Db | null = null;

export async function connectMongo(): Promise<Db> {
  if (!mongoDbInstance) {
    await mongoClient.connect();
    mongoDbInstance = mongoClient.db(dbName);
    console.log(`[MONGODB] Connected to MongoDB database: ${dbName} at ${uri}`);
  }
  return mongoDbInstance;
}

export function getMongoDb(): Db {
  if (!mongoDbInstance) {
    throw new Error('MongoDB not initialized. Call connectMongo() first.');
  }
  return mongoDbInstance;
}

