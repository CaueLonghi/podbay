import { Pool as PgPool } from 'pg';
import { Pool as NeonPool } from '@neondatabase/serverless';

const isProduction = process.env.NODE_ENV === 'production';

const productionUrl =
  process.env.podbay_db_DATABASE_URL ?? process.env.DATABASE_URL;

const devConnectionString =
  process.env.DATABASE_URL ??
  `postgresql://${process.env.DB_USER}:${encodeURIComponent(process.env.DB_PASSWORD ?? '')}@${process.env.DB_HOST ?? '127.0.0.1'}:${process.env.DB_PORT ?? '5432'}/${process.env.DB_NAME}?sslmode=disable`;

// Em produção: NeonPool usa HTTP (sem TCP, sem cold start)
// Em desenvolvimento: PgPool com conexão local TCP
const globalForDb = globalThis as unknown as { db: PgPool | NeonPool | undefined };

export const db: Pick<PgPool, 'query'> =
  globalForDb.db ??
  (isProduction && productionUrl
    ? new NeonPool({ connectionString: productionUrl })
    : new PgPool({ connectionString: devConnectionString }));

if (process.env.NODE_ENV !== 'production') globalForDb.db = db as PgPool;
