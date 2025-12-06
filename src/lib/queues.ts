import { Queue } from 'bullmq';

// Use Redis URL if available, otherwise fall back to individual configs
const redisUrl = process.env.REDIS_URL;
const connection = redisUrl 
  ? redisUrl
  : {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      maxRetriesPerRequest: null,
    };

export const videoAnalysisQueue = new Queue('VIDEO_ANALYSIS', { connection });