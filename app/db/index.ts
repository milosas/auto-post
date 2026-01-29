import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Use Supabase connection pooler for serverless
const client = postgres(process.env.DATABASE_URL!);

// Export db with schema for relational queries
export const db = drizzle(client, { schema });
