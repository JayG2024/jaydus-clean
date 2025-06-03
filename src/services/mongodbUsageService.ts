import { getDb, COLLECTIONS } from '../mongodb/client';
import { logError, ErrorSeverity } from '../utils/errorLogger';
import { ObjectId } from 'mongodb';

export interface UsageRecord {
  _id?: string | ObjectId;
  userId: string;
  type: 'text' | 'image' | 'video' | 'audio';
  model: string;
  tokensInput?: number;
  tokensOutput?: number;
  cost: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export async function recordUsage(usageData: Omit<UsageRecord, 'timestamp'>) {
  try {
    const db = getDb();
    const collection = db.collection(COLLECTIONS.USAGE);
    
    const newUsage = {
      ...usageData,
      timestamp: new Date(),
    };
    
    const result = await collection.insertOne(newUsage);
    return { ...newUsage, _id: result.insertedId };
  } catch (error) {
    logError(
      'Error recording usage in MongoDB',
      {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        usageData,
        tags: ['mongodb', 'usage', 'create']
      },
      ErrorSeverity.ERROR
    );
    throw error;
  }
}

export async function getUserUsage(userId: string, startDate?: Date, endDate?: Date) {
  try {
    const db = getDb();
    const collection = db.collection(COLLECTIONS.USAGE);
    
    const query: any = { userId };
    
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = startDate;
      if (endDate) query.timestamp.$lte = endDate;
    }
    
    return await collection.find(query).sort({ timestamp: -1 }).toArray() as UsageRecord[];
  } catch (error) {
    logError(
      'Error getting user usage from MongoDB',
      {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        userId,
        startDate,
        endDate,
        tags: ['mongodb', 'usage', 'read']
      },
      ErrorSeverity.ERROR
    );
    throw error;
  }
}

export async function getUserUsageSummary(userId: string, startDate?: Date, endDate?: Date) {
  try {
    const db = getDb();
    const collection = db.collection(COLLECTIONS.USAGE);
    
    const matchStage: any = { userId };
    
    if (startDate || endDate) {
      matchStage.timestamp = {};
      if (startDate) matchStage.timestamp.$gte = startDate;
      if (endDate) matchStage.timestamp.$lte = endDate;
    }
    
    const pipeline = [
      { $match: matchStage },
      { 
        $group: {
          _id: {
            type: "$type",
            model: "$model"
          },
          count: { $sum: 1 },
          totalCost: { $sum: "$cost" },
          totalTokensInput: { $sum: "$tokensInput" },
          totalTokensOutput: { $sum: "$tokensOutput" }
        }
      },
      {
        $project: {
          _id: 0,
          type: "$_id.type",
          model: "$_id.model",
          count: 1,
          totalCost: 1,
          totalTokensInput: 1,
          totalTokensOutput: 1
        }
      }
    ];
    
    return await collection.aggregate(pipeline).toArray();
  } catch (error) {
    logError(
      'Error getting user usage summary from MongoDB',
      {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        userId,
        startDate,
        endDate,
        tags: ['mongodb', 'usage', 'read']
      },
      ErrorSeverity.ERROR
    );
    throw error;
  }
}