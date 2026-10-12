import 'dotenv/config';

const required = ['MONGODB_URI', 'AWS_REGION', 'S3_BUCKET'];
const missing = required.filter((name) => !process.env[name]);

if (missing.length > 0) {
  throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
}

export const config = {
  port: Number(process.env.PORT ?? 5000),
  clientOrigin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
  mongoUri: process.env.MONGODB_URI,
  awsRegion: process.env.AWS_REGION,
  s3Bucket: process.env.S3_BUCKET,
  uploadUrlExpiresIn: Number(process.env.UPLOAD_URL_EXPIRES_IN ?? 300),
  imageUrlExpiresIn: Number(process.env.IMAGE_URL_EXPIRES_IN ?? 3600)
};
