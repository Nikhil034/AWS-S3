import mongoose from 'mongoose';
import { app } from './app.js';
import { config } from './config.js';

try {
  await mongoose.connect(config.mongoUri);
  app.listen(config.port, () => {
    console.log(`Product API listening on http://localhost:${config.port}`);
  });
} catch (error) {
  console.error('Failed to connect to MongoDB:', error);
  process.exitCode = 1;
}
