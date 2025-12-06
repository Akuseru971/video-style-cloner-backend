import { Worker } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import gcpVideoClient from '../lib/gcpVideo';
import { bucket } from '../lib/storage';

const prisma = new PrismaClient();
const connection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null,
});

const worker = new Worker(
  'INGEST_AND_ANALYZE',
  async (job) => {
    const { jobId } = job.data;
    console.log(`[INGEST] Processing job ${jobId}`);

    const videoJob = await prisma.videoJob.findUnique({ where: { id: jobId } });
    if (!videoJob) return;

    // TODO: download video from sourceUrl
    // For now we simulate upload to GCS
    const sourceVideoUri = `gs://${process.env.GCP_BUCKET_NAME}/videos/${jobId}/source.mp4`;

    await prisma.videoJob.update({
      where: { id: jobId },
      data: { sourceVideoUri },
    });

    // TODO: Call GCP Video Intelligence
    // For MVP: create a simple template
    const templateJson = {
      id: 'tpl_auto',
      format: '9:16',
      duration: 10,
      elements: [
        {
          type: 'video',
          name: 'background',
          src: 'https://cdn.example.com/default-bg.mp4',
          start: 0,
          duration: 10,
        },
        {
          type: 'image',
          name: 'main_logo',
          src: 'https://cdn.example.com/placeholder.png',
          position: 'top-right',
          start: 0,
          duration: 10,
        },
        {
          type: 'text',
          name: 'hook',
          text: 'Texte hook',
          start: 0,
          duration: 3,
          style: { fontSize: 64, fill: '#ffffff' },
        },
        {
          type: 'text',
          name: 'benefit',
          text: 'Texte bénéfice',
          start: 3,
          duration: 4,
          style: { fontSize: 52, fill: '#ffffff' },
        },
        {
          type: 'text',
          name: 'cta',
          text: 'CTA',
          start: 7,
          duration: 3,
          style: { fontSize: 56, fill: '#FF006E' },
        },
      ],
    };

    const slots = {
      textSlots: [
        { key: 'hook', sceneIndex: 0, description: 'Hook principal', defaultText: '' },
        { key: 'benefit', sceneIndex: 1, description: 'Bénéfice clé', defaultText: '' },
        { key: 'cta', sceneIndex: 2, description: 'Call to action', defaultText: '' },
      ],
      logoSlots: [{ key: 'main_logo', sceneIndex: 0, description: 'Logo principal' }],
      mediaSlots: [],
    };

    const template = await prisma.template.create({
      data: {
        sourceVideoJobId: jobId,
        name: 'Auto Template',
        engine: 'creatomate',
        renderScript: templateJson,
        slots,
      },
    });

    await prisma.videoJob.update({
      where: { id: jobId },
      data: {
        templateId: template.id,
        status: 'STRUCTURE_BUILT',
      },
    });

    console.log(`[INGEST] Job ${jobId} completed`);
  },
  { connection }
);

worker.on('completed', (job) => {
  console.log(`✅ Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`❌ Job ${job?.id} failed:`, err.message);
});

console.log('🎬 Ingest & Analyze Worker started');
