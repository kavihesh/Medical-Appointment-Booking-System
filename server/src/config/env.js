import { z } from 'zod';

const envSchema = z.object({
  MONGODB_URI: z.string().regex(/^mongodb(\+srv)?:\/\//, 'must be a MongoDB connection string'),
  PORT: z.coerce.number().int().positive().default(5000),
  CLIENT_ORIGIN: z.string().default('http://localhost:5173'),
});

/** Reads and validates environment variables; exits immediately if any are missing or invalid. */
export function loadEnv(source = process.env) {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    console.error('Invalid environment configuration:', z.flattenError(result.error).fieldErrors);
    console.error('Copy server/.env.example to server/.env and fill in the values.');
    process.exit(1);
  }
  return {
    ...result.data,
    CLIENT_ORIGINS: result.data.CLIENT_ORIGIN.split(',').map((origin) => origin.trim()),
  };
}
