import { Hono } from 'hono';
import { assignmentService } from '../services/assignment.service.js';
import type { AccessTokenClaims } from '../lib/auth/jwt.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

type Variables = {
  user: AccessTokenClaims;
};

export const assignmentGlobalRouter = new Hono<{ Variables: Variables }>()
  .use('*', authMiddleware)
  /**
   * [GET] /assignments
   * Lists all assignments for the current tenant.
   */
  .get('/', async (c) => {
    const search = c.req.query('search');
    const assignments = await assignmentService.listAssignments(search);
    
    return c.json({
      status: 'success',
      data: assignments.data,
    });
  })
  /**
   * [GET] /assignments/:id
   * Retrieves a specific assignment by ID.
   */
  .get('/:id', async (c) => {
    const id = parseInt(c.req.param('id'), 10);
    const assignment = await assignmentService.getAssignmentById(id);
    
    return c.json({
      status: 'success',
      data: assignment,
    });
  });
