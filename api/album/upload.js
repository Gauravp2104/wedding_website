import { handleUpload } from '@vercel/blob/client';
import { incr, logger, newRequestId } from '../../lib/logger.js';

/*
 * POST /api/album/upload — mints a short-lived client-upload token so the
 * browser uploads photos *directly* to Vercel Blob. The file bytes never pass
 * through this function, so the 4.5MB serverless body limit doesn't apply.
 *
 * Admin auth: the browser sends the shared ADMIN_PASSWORD as clientPayload;
 * we reject token minting unless it matches.
 */
export default async function handler(req, res) {
  const requestId = newRequestId();
  res.setHeader('X-Request-Id', requestId);

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed.' });
  }

  try {
    const jsonResponse = await handleUpload({
      request: req,
      body: req.body,
      onBeforeGenerateToken: async (_pathname, clientPayload) => {
        if (!process.env.ADMIN_PASSWORD || clientPayload !== process.env.ADMIN_PASSWORD) {
          throw new Error('Unauthorized');
        }
        return {
          allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/gif'],
          addRandomSuffix: true,
          maximumSizeInBytes: 25 * 1024 * 1024, // 25MB
        };
      },
      onUploadCompleted: async ({ blob }) => {
        incr('albumUploaded');
        logger.info('album.uploaded', { requestId, url: blob.url });
      },
    });
    return res.status(200).json(jsonResponse);
  } catch (err) {
    incr('albumUploadFailed');
    logger.error('album.upload.failed', { requestId, error: err.message });
    const code = err.message === 'Unauthorized' ? 401 : 400;
    return res.status(code).json({ ok: false, error: err.message });
  }
}
