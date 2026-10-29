import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL || '';
const isLocal =
  connectionString.includes('localhost') ||
  connectionString.includes('127.0.0.1');

const pool = new pg.Pool({
  connectionString,
  ...(isLocal ? {} : { ssl: { rejectUnauthorized: false } }),
});

const adapter = new PrismaPg(pool);
export const prisma = new PrismaClient({ adapter });
