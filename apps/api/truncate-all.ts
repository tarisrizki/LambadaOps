import { neon } from '@neondatabase/serverless';

const sql = neon('postgres://neondb_owner:npg_B6JjoMgYUa8X@ep-rough-dawn-azsa0jl6-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require');

async function main() {
  console.log('Dropping schema public...');
  await sql`DROP SCHEMA public CASCADE;`;
  await sql`CREATE SCHEMA public;`;
  await sql`GRANT ALL ON SCHEMA public TO public;`;
  console.log('Done!');
}
main();
