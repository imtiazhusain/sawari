import 'dotenv/config';
import { z } from 'zod';
const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  MONGO_URI: z.string().min(1, 'MONGO_URI is required'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  DRIVER_SEARCH_RADIUS_KM: z.coerce.number().positive().default(5),
});
const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  // Fail fast with a readable message; never print values (they may be secrets).
  const problems = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
  throw new Error(`Invalid environment configuration — ${problems}`);
}
export const env = parsed.data;
