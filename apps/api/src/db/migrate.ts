import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { migrate } from 'drizzle-orm/neon-http/migrator';
import { getEnv, initEnv } from '../lib/env.js';

initEnv();
const env = getEnv();

async function main() {
  console.log('Running migrations via neon-http...');
  const sql = neon(env.DATABASE_URL);
  const db = drizzle(sql);
  
  await migrate(db, { migrationsFolder: 'drizzle/migrations' });
  console.log('Migrations complete!');
}

main().catch(console.error);
