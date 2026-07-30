import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { getEnv } from '../lib/env.js';
import * as schema from './schema/index.js';

const env = getEnv();

// Use Pool to support full interactive transactions and standard postgres URLs
const pool = new Pool({ connectionString: env.DATABASE_URL });

export const db = drizzle(pool, { schema });
