import { neon } from '@neondatabase/serverless';

const sql = neon('postgres://neondb_owner:npg_B6JjoMgYUa8X@ep-rough-dawn-azsa0jl6-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require');

async function main() {
  console.log('Truncating tables...');
  await sql`TRUNCATE TABLE assets CASCADE;`;
  console.log('Done!');
}
main();
