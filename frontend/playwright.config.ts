import { defineConfig } from '@playwright/test';

// Expects the full stack to be running: `docker compose up` + `docker compose exec api npm run seed`
export default defineConfig({
  testDir: './e2e',
  use: { baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:8080' },
});
