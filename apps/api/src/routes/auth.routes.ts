import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { authService, loginSchema } from '../services/auth.service.js';
import { registrationRoutes } from './registration.routes.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { globalUserRepository } from '../repositories/user.repository.js';

export const authRoutes = new Hono()
  .route('/register', registrationRoutes)
  .get('/me', authMiddleware, async (c) => {
    const user = c.get('user');
    const profile = await globalUserRepository.findByIdGlobal(user.userId);
    if (!profile) {
      return c.json({ message: 'User not found' }, 404);
    }
    
    return c.json({
      id: profile.id,
      email: profile.email,
      name: profile.name,
      tenantId: profile.tenantId,
      roleId: profile.roleId,
    });
  })
  .post(
    '/login',
    zValidator('json', loginSchema),
    async (c) => {
      const data = c.req.valid('json');
      const result = await authService.login(data);
      
      return c.json(result);
    }
  );
