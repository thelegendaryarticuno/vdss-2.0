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

export const config = {
  database: {
    url: 'postgresql://neondb_owner:npg_dyDij4uG8tmL@ep-noisy-bonus-ahjoccyc-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  },
  jwt: {
    secret: 'change_this_secret_key_in_production_min_32_chars',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  server: {
    port: 4000,
    nodeEnv: process.env.NODE_ENV || 'development',
  },
  aiService: {
    baseUrl: process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000',
    timeoutMs: parseInt(process.env.AI_SERVICE_TIMEOUT_MS || '4000', 10),
  },
  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASS,
    fromEmail: process.env.SMTP_FROM_EMAIL,
  },
};
