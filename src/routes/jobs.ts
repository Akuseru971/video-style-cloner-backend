import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { ingestAndAnalyzeQueue, renderQueue } from '../lib/queues';

const router = Router();
const prisma = new PrismaClient();

// POST /jobs - Create new job
router.post('/', async (req, res) => {
  try {
    const { source_url } = req.body;
    const userId = req.body.user_id || 'demo-user'; // TODO: add auth

    const job = await prisma.videoJob.create({
      data: {
        userId,
        sourceUrl: source_url,
        status: 'PENDING_ANALYSIS',
      },
    });

    await ingestAndAnalyzeQueue.add('INGEST_AND_ANALYZE', { jobId: job.id });

    res.json({ job_id: job.id, status: job.status });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /jobs/:id - Get job status
router.get('/:id', async (req, res) => {
  try {
    const job = await prisma.videoJob.findUnique({
      where: { id: req.params.id },
      include: { template: true, inputs: true },
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json({
      job_id: job.id,
      status: job.status,
      template: job.template
        ? {
            id: job.template.id,
            slots: job.template.slots,
          }
        : null,
      inputs: job.inputs ? { texts: job.inputs.texts, colors: job.inputs.colors } : null,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /jobs/:id/inputs - Submit inputs
router.post('/:id/inputs', async (req, res) => {
  try {
    const { logo_uri, texts, colors, options } = req.body;
    const jobId = req.params.id;

    const job = await prisma.videoJob.findUnique({ where: { id: jobId } });
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    await prisma.clientInputs.upsert({
      where: { videoJobId: jobId },
      update: { logoUri: logo_uri, texts, colors, options },
      create: { videoJobId: jobId, logoUri: logo_uri, texts, colors, options },
    });

    await prisma.videoJob.update({
      where: { id: jobId },
      data: { status: 'READY_TO_RENDER' },
    });

    res.json({ job_id: jobId, status: 'READY_TO_RENDER' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /jobs/:id/render - Launch render
router.post('/:id/render', async (req, res) => {
  try {
    const jobId = req.params.id;

    const job = await prisma.videoJob.findUnique({
      where: { id: jobId },
      include: { template: true, inputs: true },
    });

    if (!job || !job.template || !job.inputs) {
      return res.status(400).json({ error: 'Missing template or inputs' });
    }

    await prisma.videoJob.update({
      where: { id: jobId },
      data: { status: 'RENDERING' },
    });

    await renderQueue.add('RENDER_VIDEO', { jobId });

    res.json({ job_id: jobId, status: 'RENDERING' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /jobs/:id/result - Get final result
router.get('/:id/result', async (req, res) => {
  try {
    const job = await prisma.videoJob.findUnique({ where: { id: req.params.id } });
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json({
      job_id: job.id,
      status: job.status,
      outputs: job.outputUrls || {},
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
