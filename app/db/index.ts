import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

// Use pooled connection for serverless (DATABASE_URL, not DATABASE_URL_UNPOOLED)
const sql = neon(process.env.DATABASE_URL!);

// Export db with schema for relational queries
export const db = drizzle(sql, { schema });
