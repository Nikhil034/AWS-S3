import { randomUUID } from 'node:crypto';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Router } from 'express';
import { config } from '../config.js';
import { s3 } from '../s3.js';

const router = Router();
const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const maxBytes = 10 * 1024 * 1024;

router.post('/presign', async (req, res, next) => {
  try {
    const { contentType, size } = req.body ?? {};
    if (!allowedTypes.has(contentType)) {
      return res.status(400).json({ message: 'Choose a JPEG, PNG, WebP, or GIF image.' });
    }
    if (!Number.isInteger(size) || size <= 0 || size > maxBytes) {
      return res.status(400).json({ message: 'Image must be between 1 byte and 10 MB.' });
    }

    const extension = contentType.split('/')[1].replace('jpeg', 'jpg');
    const imageKey = `products/${randomUUID()}.${extension}`;
    const command = new PutObjectCommand({
      Bucket: config.s3Bucket,
      Key: imageKey,
      ContentType: contentType
    });
    const uploadUrl = await getSignedUrl(s3, command, {
      expiresIn: config.uploadUrlExpiresIn
    });

    res.json({ uploadUrl, imageKey });
  } catch (error) {
    next(error);
  }
});

export default router;
