# Video Style Cloner - Backend API

Plateforme d'automatisation de clonage de style vidéo - Colle le lien d'une vidéo, obtiens ta version avec ton logo et ton message.

## Architecture

- **Backend**: Node.js + TypeScript + Express
- **DB**: PostgreSQL + Prisma ORM
- **Queue**: BullMQ + Redis
- **Storage**: Google Cloud Storage
- **Vidéo Analysis**: Google Cloud Video Intelligence
- **Vidéo Rendering**: Creatomate

## Structure du projet

```
backend/
├── src/
│   ├── index.ts              # Point d'entrée
│   ├── routes/
│   │   └── jobs.ts           # Routes API
│   ├── workers/
│   │   ├── ingestAndAnalyze.ts
│   │   └── renderVideo.ts
│   └── lib/
│       ├── prisma.ts
│       ├── queues.ts
│       ├── creatomate.ts
│       ├── gcpVideo.ts
│       └── storage.ts
├── prisma/
│   └── schema.prisma
├── package.json
├── tsconfig.json
└── .env.example
```

## Installation locale

### 1. Installer les dépendances

```bash
npm install
```

### 2. Configurer les variables d'environnement

```bash
cp .env.example .env
# Édite .env avec tes clés API
```

### 3. Lancer PostgreSQL et Redis (Docker)

```bash
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=password postgres:15
docker run -d -p 6379:6379 redis:7
```

### 4. Migrer la base de données

```bash
npm run prisma:migrate
npm run prisma:generate
```

### 5. Lancer le serveur + workers

Terminal 1 - API:
```bash
npm run dev
```

Terminal 2 - Ingest Worker:
```bash
tsx watch src/workers/ingestAndAnalyze.ts
```

Terminal 3 - Render Worker:
```bash
tsx watch src/workers/renderVideo.ts
```

## API Endpoints

### `POST /jobs`
Créer un nouveau job d'analyse

```json
{
  "source_url": "https://www.tiktok.com/..."
}
```

Réponse:
```json
{
  "job_id": "uuid",
  "status": "PENDING_ANALYSIS"
}
```

### `GET /jobs/:id`
Récupérer le statut + template

### `POST /jobs/:id/inputs`
Soumettre logo + textes

```json
{
  "logo_uri": "https://...",
  "texts": {
    "hook": "Ton message ici",
    "benefit": "...",
    "cta": "..."
  },
  "colors": {
    "primary": "#FF006E"
  },
  "options": {
    "formats": ["9:16", "1:1"]
  }
}
```

### `POST /jobs/:id/render`
Lancer le rendu vidéo

### `GET /jobs/:id/result`
Récupérer la vidéo finale

## Déploiement sur Railway

### 1. Créer un projet Railway

```bash
railway init
```

### 2. Ajouter PostgreSQL + Redis

Dans le dashboard Railway :
- Ajoute un service **PostgreSQL**
- Ajoute un service **Redis**

### 3. Configurer les variables d'environnement

Dans Railway, Settings > Variables :
- `DATABASE_URL` (auto depuis Postgres)
- `REDIS_HOST` (auto depuis Redis)
- `REDIS_PORT` (auto depuis Redis)
- `GCP_PROJECT_ID`
- `GCP_BUCKET_NAME`
- `CREATOMATE_API_KEY`
- `GOOGLE_APPLICATION_CREDENTIALS` (upload le JSON)

### 4. Déployer

```bash
railway up
```

## Prochaines étapes

- [ ] Implémenter le téléchargement réel des vidéos (TikTok, YouTube, Instagram)
- [ ] Intégrer l'API Google Video Intelligence pour l'analyse
- [ ] Intégrer l'API Creatomate pour le rendu réel
- [ ] Ajouter l'authentification utilisateur (JWT)
- [ ] Implémenter le système de crédits
- [ ] Ajouter des webhooks pour la notification de fin de rendu
- [ ] Créer un frontend Next.js

## Licence

MIT
