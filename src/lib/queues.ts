import { Queue } from 'bullmq';

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null,
    password: process.env.REDIS_PASSWORD,
};

export const videoAnalysisQueue = new Queue('VIDEO_ANALYSIS', { connection });
