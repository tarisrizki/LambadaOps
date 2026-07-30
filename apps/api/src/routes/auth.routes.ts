import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { authService, loginSchema } from '../services/auth.service.js';
import { registrationRoutes } from './registration.routes.js';

export const authRoutes = new Hono();

authRoutes.route('/register', registrationRoutes);

authRoutes.post(
  '/login',
  zValidator('json', loginSchema),
  async (c) => {
    const data = c.req.valid('json');
    const result = await authService.login(data);
    
    return c.json(result);
  }
);
