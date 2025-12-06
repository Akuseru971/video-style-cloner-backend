import { Queue } from 'bullmq';

const connection = {
  host: process.env.REDIS_HOST || 'redis.railway.internal',
  port: parseInt(process.env.REDIS_PORT || '6379'),
};

export const videoAnalysisQueue = new Queue('VIDEO_ANALYSIS', { connection });