import { GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Router } from 'express';
import { config } from '../config.js';
import { Product } from '../models/Product.js';
import { s3 } from '../s3.js';

const router = Router();
const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const maxImageBytes = 10 * 1024 * 1024;

router.get('/', async (_req, res, next) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 }).lean();
    const results = await Promise.all(
      products.map(async ({ _id, name, description, price, imageKey, createdAt }) => ({
        id: _id.toString(),
        name,
        description,
        price,
        imageUrl: await getSignedUrl(
          s3,
          new GetObjectCommand({ Bucket: config.s3Bucket, Key: imageKey }),
          { expiresIn: config.imageUrlExpiresIn }
        ),
        createdAt
      }))
    );

    res.json(results);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, description, price, imageKey } = req.body ?? {};
    const numericPrice = Number(price);

    if (
      typeof name !== 'string' ||
      !name.trim() ||
      name.trim().length > 120 ||
      typeof description !== 'string' ||
      !description.trim() ||
      description.trim().length > 2000 ||
      price === '' ||
      !Number.isFinite(numericPrice) ||
      numericPrice < 0 ||
      typeof imageKey !== 'string' ||
      !/^products\/[a-f0-9-]+\.(jpg|png|webp|gif)$/i.test(imageKey)
    ) {
      return res.status(400).json({ message: 'Enter valid product details and upload an image.' });
    }

    const uploadedImage = await s3.send(
      new HeadObjectCommand({ Bucket: config.s3Bucket, Key: imageKey })
    );
    if (
      !allowedTypes.has(uploadedImage.ContentType) ||
      !Number.isInteger(uploadedImage.ContentLength) ||
      uploadedImage.ContentLength <= 0 ||
      uploadedImage.ContentLength > maxImageBytes
    ) {
      return res.status(400).json({ message: 'Uploaded image must be a supported type under 10 MB.' });
    }

    const product = await Product.create({
      name: name.trim(),
      description: description.trim(),
      price: numericPrice,
      imageKey
    });

    res.status(201).json({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      imageKey: product.imageKey,
      createdAt: product.createdAt
    });
  } catch (error) {
    if (error?.$metadata?.httpStatusCode === 403) {
      return res.status(502).json({
        message:
          'S3 denied image verification. Grant the API AWS identity s3:GetObject on this bucket’s products/* objects; check any bucket policy or KMS key policy too.'
      });
    }
    if (error?.name === 'NotFound' || error?.$metadata?.httpStatusCode === 404) {
      return res.status(400).json({ message: 'The uploaded image could not be found in S3.' });
    }
    next(error);
  }
});

export default router;
