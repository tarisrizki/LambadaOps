import { Hono } from 'hono';
import { assetRepository } from '../repositories/asset.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import type { AccessTokenClaims } from '../lib/auth/jwt.js';

type Variables = {
  user: AccessTokenClaims;
};

export const referenceRouter = new Hono<{ Variables: Variables }>()
  .use('*', authMiddleware)
  .get('/categories', async (c) => {
    const categories = await assetRepository.getCategories();
    return c.json({
      status: 'success',
      data: categories,
    });
  })
  .get('/locations', async (c) => {
    const locations = await assetRepository.getLocations();
    return c.json({
      status: 'success',
      data: locations,
    });
  })
  .get('/departments', async (c) => {
    const departments = await assetRepository.getDepartments();
    return c.json({
      status: 'success',
      data: departments,
    });
  })
  .get('/users', async (c) => {
    const users = await userRepository.findAll();
    const safeUsers = users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      roleId: u.roleId,
    }));
    return c.json({
      status: 'success',
      data: safeUsers,
    });
  });
