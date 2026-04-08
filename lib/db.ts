import { Pool } from 'pg';

const globalForDb = globalThis as unknown as { db: Pool | undefined };

// Em produção (Vercel/Neon): usa DATABASE_URL com SSL embutido na string
// Em desenvolvimento: constrói a string local com sslmode=disable
const connectionString =
  process.env.DATABASE_URL ??
  `postgresql://${process.env.DB_USER}:${encodeURIComponent(process.env.DB_PASSWORD ?? '')}@${process.env.DB_HOST ?? '127.0.0.1'}:${process.env.DB_PORT ?? '5432'}/${process.env.DB_NAME}?sslmode=disable`;

export const db =
  globalForDb.db ??
  new Pool({ connectionString });

if (process.env.NODE_ENV !== 'production') globalForDb.db = db;
