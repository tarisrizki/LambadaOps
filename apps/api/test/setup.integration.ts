import { initEnv } from '../src/lib/env.js';
import { db } from '../src/db/index.js';
import { tenants, users, roles, plans, subscriptions } from '../src/db/schema/index.js';
import { assetCategories, departments, locations } from '../src/db/schema/asset.schema.js';
import { generateAccessToken } from '../src/lib/auth/jwt.js';
import { SystemRoles } from '../src/lib/auth/roles.js';
import crypto from 'node:crypto';

// Initialize env synchronously before tests run
initEnv();

export async function createTestTenant() {
  const uniqueId = crypto.randomUUID().substring(0, 8);
  const slug = `test-tenant-${uniqueId}`;

  // 1. Create Tenant
  const [tenant] = await db.insert(tenants).values({
    name: `Test Tenant ${uniqueId}`,
    slug,
  }).returning();

  // 2. Seed System Roles (if they don't exist)
  await db.insert(roles).values([
    { id: SystemRoles.OWNER_ADMIN, name: 'Owner/Admin', slug: 'owner-admin' },
    { id: SystemRoles.IT_MANAGER, name: 'IT Manager', slug: 'it-manager' },
    { id: SystemRoles.TECHNICIAN, name: 'Technician', slug: 'technician' },
    { id: SystemRoles.EMPLOYEE, name: 'Employee', slug: 'employee' },
  ]).onConflictDoNothing();

  const [user] = await db.insert(users).values({
    tenantId: tenant.id,
    name: 'Test Admin',
    email: `admin-${crypto.randomUUID().split('-')[0]}@test.com`,
    password: 'hashed-password',
    roleId: SystemRoles.OWNER_ADMIN,
  }).returning();

  // 3. Create active subscription to bypass plan limits
  const [plan] = await db.insert(plans).values({
    name: `Test Plan ${uniqueId}`,
    code: `plan_${uniqueId}`,
    stripeProductId: `prod_${uniqueId}`,
    priceMonthly: 1000,
    assetLimit: 10000,
    userLimit: null,
  }).returning();

  await db.insert(subscriptions).values({
    tenantId: tenant.id,
    planId: plan.id,
    status: 'active',
  });

  // 4. Create required Master Data for Assets
  const [category] = await db.insert(assetCategories).values({
    tenantId: tenant.id,
    name: 'IT Equipment',
  }).returning();

  const [department] = await db.insert(departments).values({
    tenantId: tenant.id,
    name: 'Engineering',
  }).returning();

  const [location] = await db.insert(locations).values({
    tenantId: tenant.id,
    name: 'Headquarters',
  }).returning();

  // Generate Token
  const token = await generateAccessToken({
    userId: user.id,
    tenantId: tenant.id,
    roleId: user.roleId,
  });

  return {
    tenant,
    user,
    token,
    category,
    department,
    location,
  };
}
