import { Worker } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import creatomateClient from '../lib/creatomate';

const prisma = new PrismaClient();
const connection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null,
});

const worker = new Worker(
  'RENDER_VIDEO',
  async (job) => {
    const { jobId } = job.data;
    console.log(`[RENDER] Processing job ${jobId}`);

    const videoJob = await prisma.videoJob.findUnique({
      where: { id: jobId },
      include: { template: true, inputs: true },
    });

    if (!videoJob || !videoJob.template || !videoJob.inputs) return;

    // Build modifications from inputs
    const modifications: any = {};
    const inputs = videoJob.inputs as any;

    // Map texts
    if (inputs.texts) {
      Object.keys(inputs.texts).forEach((key) => {
        modifications[`${key}.text`] = inputs.texts[key];
      });
    }

    // Map logo
    if (inputs.logoUri) {
      modifications['main_logo.src'] = inputs.logoUri;
    }

    // Map colors
    if (inputs.colors && inputs.colors.primary) {
      modifications['cta.style.fill'] = inputs.colors.primary;
    }

    console.log(`[RENDER] Calling Creatomate with modifications:`, modifications);

    // TODO: Call Creatomate API
    // For MVP: simulate render
    const mockOutputUrl = `https://cdn.example.com/renders/${jobId}/final-9x16.mp4`;

    await prisma.videoJob.update({
      where: { id: jobId },
      data: {
        outputUrls: { '9:16': mockOutputUrl },
        status: 'READY',
      },
    });

    console.log(`[RENDER] Job ${jobId} completed`);
  },
  { connection }
);

worker.on('completed', (job) => {
  console.log(`✅ Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`❌ Job ${job?.id} failed:`, err.message);
});

console.log('🎥 Render Video Worker started');
