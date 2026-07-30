import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { attachmentService } from '../services/attachment.service.js';
import { validateMagicNumber, sanitizeFilename } from '../lib/file-validation.js';
import type { AccessTokenClaims } from '../lib/auth/jwt.js';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

// Hono provides standard multipart/form-data parsing via req.parseBody()
// but we validate the metadata using Zod
const uploadMetadataSchema = z.object({
  attachmentType: z.enum(['photo', 'invoice', 'manual', 'certificate', 'warranty', 'other']).default('other'),
  note: z.string().optional(),
});

export const attachmentRouter = new Hono<{ Variables: { user: AccessTokenClaims } }>();

/**
 * Upload an attachment to an asset
 */
attachmentRouter.post(
  '/:assetId/attachments',
  zValidator('param', z.object({ assetId: z.coerce.number() })),
  zValidator('form', uploadMetadataSchema),
  async (c) => {
    const { assetId } = c.req.valid('param');
    const { attachmentType } = c.req.valid('form');
    
    const body = await c.req.parseBody();
    const file = body['file'];

    if (!file || typeof file === 'string') {
      return c.json({ error: 'Missing or invalid file part' }, 400);
    }

    if (file.size > MAX_FILE_SIZE) {
      return c.json({ error: 'File exceeds 5MB limit' }, 400);
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return c.json({ error: 'Invalid file type. Only JPG, PNG, and PDF are allowed.' }, 400);
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // 3. Magic Number Validation
    if (!validateMagicNumber(fileBuffer, file.type)) {
      return c.json({ error: 'File signature does not match declared MIME type' }, 400);
    }

    // 4. Filename Sanitization
    const safeFilename = sanitizeFilename(file.name);

    const result = await attachmentService.uploadAttachment({
      assetId,
      originalFileName: safeFilename,
      mimeType: file.type,
      fileBuffer,
      attachmentType,
      actorUserId: c.get('user').userId,
      actorNameSnapshot: `User ${c.get('user').userId}`,
    });

    return c.json({ data: result }, 201);
  }
);

/**
 * List all attachments for an asset
 */
attachmentRouter.get(
  '/:assetId/attachments',
  zValidator('param', z.object({ assetId: z.coerce.number() })),
  async (c) => {
    const { assetId } = c.req.valid('param');
    const result = await attachmentService.listAttachments(assetId);
    return c.json({ data: result });
  }
);

/**
 * Get a presigned download URL for an attachment
 */
attachmentRouter.get(
  '/:assetId/attachments/:attachmentId/download',
  zValidator('param', z.object({ 
    assetId: z.coerce.number(),
    attachmentId: z.coerce.number()
  })),
  async (c) => {
    const { assetId, attachmentId } = c.req.valid('param');
    const result = await attachmentService.getDownloadUrl(attachmentId, assetId);
    
    // Can either redirect directly to the URL or return it for the client to use
    // For API design, returning the URL is usually better so the frontend can handle it
    return c.json({ data: result });
  }
);

/**
 * Delete an attachment
 */
attachmentRouter.delete(
  '/:assetId/attachments/:attachmentId',
  zValidator('param', z.object({ 
    assetId: z.coerce.number(),
    attachmentId: z.coerce.number()
  })),
  async (c) => {
    const { assetId, attachmentId } = c.req.valid('param');
    const result = await attachmentService.deleteAttachment(
      attachmentId, 
      assetId, 
      c.get('user').userId, 
      `User ${c.get('user').userId}`
    );
    
    return c.json({ data: result });
  }
);
