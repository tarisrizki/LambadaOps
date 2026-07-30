import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { registrationService } from '../services/registration.service.js';
import { registerSchema } from '../schemas/registration.schema.js';

/**
 * POST /auth/register
 *
 * Pre-auth route. Orchestrates tenant, owner user, and subscription creation.
 */
export const registrationRoutes = new Hono()
  .post(
    '/',
    zValidator('json', registerSchema),
    async (c) => {
      const input = c.req.valid('json');

      const result = await registrationService.register(input);

      return c.json(
        {
          message: 'Registration successful',
          tenant: result.tenant,
          user: result.user,
        },
        201
      );
    }
  );
