/**
 * LambadaOps — Test Data Seed Script
 * Creates lambada-demo tenant + admin user for E2E testing
 * 
 * Usage: cd apps/api && bun run db:seed
 */
import { initEnv } from '../lib/env.js';
import { db } from './index.js';
import { tenants, roles } from './schema/tenant.schema.js';
import { users } from './schema/user.schema.js';
import { hashPassword } from '../lib/auth/hash.js';

initEnv();

async function runSeed() {
  console.log('🌱 Seeding test data...');

  // 1. Create tenant
  const [tenant] = await db
    .insert(tenants)
    .values({
      slug: 'lambada-demo',
      name: 'Lambada Demo',
      metadata: { source: 'seed', purpose: 'e2e-testing' },
    })
    .onConflictDoNothing()
    .returning();

  if (!tenant) {
    console.log('⚠️  Tenant already exists, using existing...');
    const existing = await db.query.tenants.findFirst({
      where: (t, { eq }) => eq(t.slug, 'lambada-demo'),
    });
    if (!existing) throw new Error('Could not find or create tenant');
    Object.assign(tenant, existing);
  }
  console.log(`  ✓ Tenant: ${tenant.name} (${tenant.id})`);

  // 2. Create roles
  const roleData = [
    { code: 'admin', name: 'Administrator', description: 'Full access', permissions: { all: true }, isSystem: false },
    { code: 'user', name: 'Standard User', description: 'Basic access', permissions: { read: true }, isSystem: false },
  ];

  for (const role of roleData) {
    await db
      .insert(roles)
      .values({ ...role, tenantId: tenant.id })
      .onConflictDoNothing();
  }

  const dbRoles = await db.query.roles.findMany({
    where: (r, { eq }) => eq(r.tenantId, tenant.id),
  });
  const adminRole = dbRoles.find((r) => r.code === 'admin');
  if (!adminRole) throw new Error('Admin role not found');
  console.log(`  ✓ Roles created (${dbRoles.length})`);

  // 3. Create admin user
  const hashedPassword = await hashPassword('TestPassword123!');
  await db
    .insert(users)
    .values({
      tenantId: tenant.id,
      email: 'admin@lambadademo.onmicrosoft.com',
      password: hashedPassword,
      fullName: 'Demo Admin',
      roleId: adminRole.id,
      isActive: true,
      metadata: { source: 'seed' },
    })
    .onConflictDoNothing();

  console.log(`  ✓ Admin user: admin@lambadademo.onmicrosoft.com`);
  console.log('\n✅ Seed complete!');
  console.log('   Company: lambada-demo');
  console.log('   Email:   admin@lambadademo.onmicrosoft.com');
  console.log('   Password: TestPassword123!');
}

runSeed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  });
