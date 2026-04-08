import { Pool } from 'pg';

const globalForDb = globalThis as unknown as { db: Pool | undefined };

const connectionString = process.env.DATABASE_URL ??
  `postgresql://${process.env.DB_USER || 'postgres'}:${encodeURIComponent(process.env.DB_PASSWORD || 'mccj7622')}@${process.env.DB_HOST || '127.0.0.1'}:${process.env.DB_PORT || '5432'}/${process.env.DB_NAME || 'podbay_db'}?sslmode=disable`;

export const db =
  globalForDb.db ??
  new Pool({ connectionString });

if (process.env.NODE_ENV !== 'production') globalForDb.db = db;
