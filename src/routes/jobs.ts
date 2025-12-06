import { Router } from 'express';
import OpenAI from 'openai';

const router = Router();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// TEST endpoint avec analyse OpenAI réelle
router.post('/test', async (req, res) => {
  try {
    const { video_url, platform } = req.body;

    // Validation des paramètres
    if (!video_url || !platform) {
      return res.status(400).json({
        success: false,
        error: 'Les paramètres video_url et platform sont requis'
      });
    }

    // Analyse du contenu vidéo avec OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Tu es un expert en marketing de contenu vidéo pour les réseaux sociaux. Ton rôle est d\'analyser des vidéos et de recommander des hashtags et de la musique pour maximiser la viralité.'
        },
        {
          role: 'user',
          content: `Analyse cette vidéo ${platform}: ${video_url}

Fournis une réponse JSON avec:
- trending_hashtags: 5 hashtags tendance
- niche_hashtags: 5 hashtags de niche spécifiques
- music_recommendations: 3-4 pistes de musique virale recommandées avec titre et artiste
- virality_score: un score de 0 à 100 estimant le potentiel viral
- analysis_summary: un résumé de l'analyse en 2-3 phrases

Format de réponse:
{
  "trending_hashtags": ["#hashtag1", "#hashtag2", ...],
  "niche_hashtags": ["#hashtag1", "#hashtag2", ...],
  "music_recommendations": [
    {"title": "Song Title", "artist": "Artist Name"},
    ...
  ],
  "virality_score": 85,
  "analysis_summary": "Résumé de l'analyse..."
}`
        }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    });

    // Parse la réponse OpenAI
    const aiAnalysis = JSON.parse(completion.choices[0].message.content || '{}');

    // Retourner la réponse
    return res.json({
      success: true,
      data: {
        video_url,
        platform,
        ...aiAnalysis,
        analyzed_at: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('Erreur OpenAI:', error);
    return res.status(500).json({
      success: false,
      error: 'Échec de l\'analyse',
      message: error.message
    });
  }
});

export default router;