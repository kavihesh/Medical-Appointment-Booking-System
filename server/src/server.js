import { createApp } from './app.js';
import { connectDatabase } from './config/db.js';
import { loadEnv } from './config/env.js';

const env = loadEnv();

try {
  await connectDatabase(env.MONGODB_URI);
} catch (err) {
  console.error('Could not connect to MongoDB:', err.message);
  console.error('Check MONGODB_URI in server/.env and that your IP is allowed in Atlas Network Access.');
  process.exit(1);
}

createApp({ clientOrigins: env.CLIENT_ORIGINS }).listen(env.PORT, () => {
  console.log(`API listening on http://localhost:${env.PORT}`);
});
