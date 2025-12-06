import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { videoAnalysisQueue } from '../lib/queues';

const router = Router();
const prisma = new PrismaClient();

// POST /analysis - Create new video analysis
router.post('/', async (req, res) => {
  try {
    const { video_url, platform, user_id } = req.body;
    const userId = user_id || 'demo-user';

    // Check user credits
    let user = await prisma.user.findUnique({ where: { email: userId } });
    if (!user) {
      user = await prisma.user.create({
        data: { email: userId, plan: 'free', credits: 3 }
      });
    }

    if (user.credits <= 0 && user.plan === 'free') {
      return res.status(403).json({ error: 'No credits remaining. Please upgrade to pro plan.' });
    }

    // Create analysis
    const analysis = await prisma.analysis.create({
      data: {
        userId: user.id,
        videoUrl: video_url,
        platform: platform || 'both',
        status: 'pending'
      }
    });

    // Deduct credit for free users
    if (user.plan === 'free') {
      await prisma.user.update({
        where: { id: user.id },
        data: { credits: user.credits - 1 }
      });
    }

    // Queue analysis job
    await videoAnalysisQueue.add('analyze-video', {
      analysisId: analysis.id,
      videoUrl: video_url,
      platform: platform || 'both'
    });

    res.json({ analysis_id: analysis.id, status: 'pending' });
  } catch (error: any) {
    console.error('Error creating analysis:', error);
    res.status(500).json({ error: 'Failed to create analysis' });
  }
});

// GET /analysis/:id - Get analysis result
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const analysis = await prisma.analysis.findUnique({
      where: { id },
      include: {
        hashtags: true,
        musicTracks: true
      }
    });

    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    res.json({
      id: analysis.id,
      status: analysis.status,
      virality_score: analysis.viralityScore,
      content_analysis: analysis.contentAnalysis,
      hashtags: analysis.hashtags.map(h => ({
        tag: h.tag,
        category: h.category,
        relevance_score: h.relevanceScore,
        trending_score: h.trendingScore
      })),
      music_tracks: analysis.musicTracks.map(m => ({
        title: m.title,
        artist: m.artist,
        preview_url: m.previewUrl,
        trending_score: m.trendingScore,
        match_score: m.matchScore,
        platform: m.platform
      })),
      error: analysis.error
    });
  } catch (error: any) {
    console.error('Error fetching analysis:', error);
    res.status(500).json({ error: 'Failed to fetch analysis' });
  }
});

// GET /user/:email/analyses - Get user's analysis history
router.get('/user/:email/history', async (req, res) => {
  try {
    const { email } = req.params;

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        analyses: {
          orderBy: { createdAt: 'desc' },
          take: 20
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      credits: user.credits,
      plan: user.plan,
      analyses: user.analyses.map(a => ({
        id: a.id,
        video_url: a.videoUrl,
        status: a.status,
        virality_score: a.viralityScore,
        created_at: a.createdAt
      }))
    });
  } catch (error: any) {
    console.error('Error fetching user history:', error);
    res.status(500).json({ error: 'Failed to fetch user history' });
  }
});

export default router;
