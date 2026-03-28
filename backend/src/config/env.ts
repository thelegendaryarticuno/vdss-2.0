import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

const envFiles = ['.env', '.env.local'];
let loaded = false;

for (const file of envFiles) {
  const filePath = path.resolve(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    dotenv.config({ path: filePath });
    loaded = true;
    break;
  }
}

if (!loaded) {
  dotenv.config();
}

const parseNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number.parseInt(value || '', 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

export const config = {
  database: {
    url:
      process.env.DATABASE_URL ||
      'postgresql://postgres:postgres@localhost:5432/vdss',
  },
  jwt: {
    secret:
      process.env.JWT_SECRET || 'change_this_secret_key_in_production_min_32_chars',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  server: {
    port: parseNumber(process.env.PORT, 4000),
    nodeEnv: process.env.NODE_ENV || 'development',
    corsOrigin: process.env.CORS_ORIGIN || '*',
  },
  aiService: {
    baseUrl: process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000',
    timeoutMs: parseNumber(process.env.AI_SERVICE_TIMEOUT_MS, 4000),
  },
  smtp: {
    host: process.env.SMTP_HOST,
    port: parseNumber(process.env.SMTP_PORT, 587),
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASS,
    fromEmail: process.env.SMTP_FROM_EMAIL,
  },
};
