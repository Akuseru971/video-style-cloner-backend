

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { videoAnalysisQueue } from '../lib/queues';

const router = Router();
const prisma = new PrismaClient();


// TEST endpoint - ultra simple, pas de DB ni Redis
router.post('/test', async (req, res) => {
    try {
    const { video_url, platform } = req.body;

    // Appel OpenAI pour analyse
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'user',
        content: `Tu es un expert en marketing digital TikTok/Instagram. Analyse cette vidéo ${platform}: ${video_url}\n\nFournis:\n1. 10 hashtags pertinents (5 trending + 5 niche)\n2. 3 sons/musiques viraux recommandés\n3. Score de viralité (0-100) basé sur le contenu\n\nFormat JSON uniquement.`
      }],
      temperature: 0.7,
    });

    const aiResponse = completion.choices[0].message.content || '';

    return res.json({
      success: true,
      message: 'Analyse terminée avec OpenAI',
      data: {
        video_url,
        platform,
        ai_analysis: aiResponse,
        analyzed_at: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('Erreur OpenAI:', error);
    return res.status(500).json({
      error: 'Échec de l\'analyse',
      message: error.message
    });
  }
});