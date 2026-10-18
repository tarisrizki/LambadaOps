import { db } from './src/db/index.js';
import { tenants } from './src/db/schema/tenant.schema.js';
import { users } from './src/db/schema/user.schema.js';
import { subscriptions } from './src/db/schema/subscription.schema.js';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { sign } from 'jsonwebtoken';

async function setup() {
  // Check if admin exists
  const existing = await db.select().from(users).where(eq(users.email, 'admin@example.com')).limit(1);
  let user, tenant;
  if (existing.length === 0) {
    const [newTenant] = await db.insert(tenants).values({ name: 'Bruno Test Tenant' }).returning();
    tenant = newTenant;
    const hash = await bcrypt.hash('Password123!', 10);
    const [newUser] = await db.insert(users).values({
      tenantId: tenant.id,
      email: 'admin@example.com',
      passwordHash: hash,
      roleId: 1
    }).returning();
    user = newUser;
  } else {
    user = existing[0];
    const t = await db.select().from(tenants).where(eq(tenants.id, user.tenantId)).limit(1);
    tenant = t[0];
  }
  const token = sign({ userId: user.id, tenantId: tenant.id, roleId: user.roleId }, process.env.JWT_SECRET || 'change-me-to-a-long-random-secret', { expiresIn: '7d' });
  console.log("TOKEN: ", token);
  process.exit(0);
}
setup().catch(console.error);
