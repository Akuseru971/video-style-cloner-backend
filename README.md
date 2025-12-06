# Viral Video Optimizer API

Plateforme d'analyse vidéo alimentée par l'IA pour maximiser la viralité sur TikTok et Instagram.

## Vue d'ensemble

Cette API analyse vos vidéos et fournit:
- **Hashtags optimisés** (trending + niche) pour maximiser la portée
- **Recommandations musicales** basées sur les tendances actuelles
- **Score de viralité** pour prédire le potentiel d'engagement
- **Analyse de contenu** détaillée avec IA (objets, scènes, émotions)

## Fonctionnalités

- ✅ Analyse vidéo avec OpenAI Vision
- ✅ Génération de hashtags trending et pertinents
- ✅ Recommandations de musique virale
- ✅ Score de viralité (0-100)
- ✅ Support TikTok et Instagram
- ✅ Freemium: 3 analyses gratuites, puis plan Pro

## Architecture

- **Backend**: Node.js + TypeScript + Express
- **Database**: PostgreSQL (Prisma ORM)
- **Queue**: BullMQ + Redis
- **AI**: OpenAI GPT-4 Vision
- **Deployment**: Railway

## API Endpoints

### POST /analysis
Crée une nouvelle analyse vidéo

```json
{
  "video_url": "https://example.com/video.mp4",
  "platform": "tiktok", // "tiktok", "instagram", ou "both"
  "user_id": "user@example.com"
}
```

**Réponse:**
```json
{
  "analysis_id": "uuid",
  "status": "pending"
}
```

### GET /analysis/:id
Récupère les résultats d'analyse

**Réponse:**
```json
{
  "id": "uuid",
  "status": "completed",
  "virality_score": 92,
  "content_analysis": {
    "objects": ["product", "person"],
    "scenes": ["unboxing"],
    "emotions": ["excited"]
  },
  "hashtags": [
    {
      "tag": "viral",
      "category": "trending",
      "relevance_score": 95,
      "trending_score": 98
    }
  ],
  "music_tracks": [
    {
      "title": "Trending Sound #1",
      "artist": "TikTok Audio",
      "trending_score": 95,
      "match_score": 90,
      "platform": "tiktok"
    }
  ]
}
```

### GET /user/:email/history
Récupère l'historique des analyses d'un utilisateur

**Réponse:**
```json
{
  "credits": 2,
  "plan": "free",
  "analyses": [
    {
      "id": "uuid",
      "video_url": "https://example.com/video.mp4",
      "status": "completed",
      "virality_score": 92,
      "created_at": "2024-12-06T10:00:00Z"
    }
  ]
}
```

## Variables d'environnement

```env
DATABASE_URL=postgresql://user:password@host:5432/dbname
REDIS_HOST=localhost
REDIS_PORT=6379
OPENAI_API_KEY=sk-...
PORT=3000
NODE_ENV=production
```

## Installation

```bash
# Installer les dépendances
npm install

# Générer le client Prisma
npx prisma generate

# Exécuter les migrations
npx prisma migrate deploy

# Démarrer le serveur
npm run dev
```

## Développement

```bash
# Mode développement avec hot reload
npm run dev

# Build production
npm run build

# Démarrer en production
npm start
```

## Worker Background

Le worker d'analyse vidéo s'exécute automatiquement au démarrage du serveur et traite les jobs en file d'attente.

## TODO: Fonctionnalités futures

- [ ] Intégration Spotify API pour données musicales réelles
- [ ] Extraction de frames vidéo pour analyse OpenAI Vision
- [ ] Scraping des hashtags trending TikTok/Instagram
- [ ] Système de cache pour les données trending
- [ ] Webhooks pour notifications de résultats
- [ ] Interface frontend React

## License

MIT
