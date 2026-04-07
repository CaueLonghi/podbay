import mysql from 'mysql2/promise';

// Pool de conexões reutilizado entre requests (singleton por processo Node)
const globalForDb = globalThis as unknown as { db: mysql.Pool | undefined };

export const db =
  globalForDb.db ??
  mysql.createPool({
    host:     process.env.DB_HOST     || 'localhost',
    port:     Number(process.env.DB_PORT) || 3306,
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME     || 'podbay_db',
    charset: 'utf8mb4',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

if (process.env.NODE_ENV !== 'production') globalForDb.db = db;
