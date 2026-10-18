import { getEnv, initEnv } from './src/lib/env.js';
import { generateAccessToken } from './src/lib/auth/jwt.js';

async function run() {
  initEnv();
  console.log("EXPIRES_IN:", JSON.stringify(getEnv().JWT_EXPIRES_IN));
  const token = await generateAccessToken({
    userId: 1,
    tenantId: 1,
    roleId: 1,
  });
  console.log("TOKEN:", token);
}
run().catch(console.error);
