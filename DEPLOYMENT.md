# VDSS 2.0 Deployment Guide

This setup uses:

- Neon for PostgreSQL
- Render for `ai-service`
- Render for `backend`
- Vercel for `frontend`

## 1. Create the Neon Database

1. Create a Neon project and database.
2. Copy the pooled PostgreSQL connection string.
3. Make sure it includes SSL, usually `?sslmode=require`.

Example:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST.neon.tech/DBNAME?sslmode=require"
```

## 2. Deploy the AI Service on Render

Create a new Render Web Service:

- Root directory: `ai-service`
- Runtime: Docker
- Dockerfile path: `./Dockerfile`
- Health check path: `/health`

Environment variables:

```env
PORT=8000
```

Render also provides its own `PORT`; the Dockerfile already uses `${PORT:-8000}`, so this service is Render-ready.

After deployment, copy the service URL, for example:

```text
https://your-ai-service.onrender.com
```

## 3. Deploy the Backend on Render

Create another Render Web Service:

- Root directory: `backend`
- Runtime: Node
- Build command: `npm install && npm run build`
- Start command: `npm run prisma:prepare && node dist/server.js`
- Health check path: `/health`

Environment variables:

```env
NODE_ENV=production
DATABASE_URL="postgresql://USER:PASSWORD@HOST.neon.tech/DBNAME?sslmode=require"
JWT_SECRET="your_strong_generated_secret"
JWT_EXPIRES_IN=7d
CORS_ORIGIN=https://your-frontend.vercel.app
AI_SERVICE_URL=https://your-ai-service.onrender.com
AI_SERVICE_TIMEOUT_MS=10000
```

Generate `JWT_SECRET` locally with:

```bash
openssl rand -base64 32
```

The backend currently uses `prisma db push` through `npm run prisma:prepare`, so it will sync the Prisma schema to Neon during startup.

Optional: seed the database once from your machine or a temporary Render shell:

```bash
cd backend
npm install
npx prisma db push --schema=./prisma/schema.prisma
npm run prisma:seed
```

Use the same `DATABASE_URL` when seeding.

## 4. Deploy the Frontend on Vercel

Import the repo into Vercel:

- Framework preset: Vite
- Root directory: `frontend`
- Build command: `npm run build`
- Output directory: `dist`

Environment variables:

```env
VITE_API_BASE_URL=https://your-backend.onrender.com
```

Deploy once. Then copy the final Vercel URL and update the backend Render environment variable:

```env
CORS_ORIGIN=https://your-frontend.vercel.app
```

Redeploy the backend after changing `CORS_ORIGIN`.

## 5. Local Development

Create local env files from the examples:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
cp ai-service/.env.example ai-service/.env
```

Run the services:

```bash
cd ai-service
pip install -r requirements.txt
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

```bash
cd backend
npm install
npm run prisma:prepare
npm run dev
```

```bash
cd frontend
npm install
npm run dev
```

Local URLs:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:4000/health`
- AI service: `http://localhost:8000/health`

## 6. Deployment Order

1. Neon database
2. AI service on Render
3. Backend on Render
4. Frontend on Vercel
5. Update backend `CORS_ORIGIN` with the final Vercel URL
6. Redeploy backend
