import { defineConfig } from '@playwright/test';
export default defineConfig({ testDir: './tests/e2e', fullyParallel: true, timeout: 30000, use: { baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3100', trace: 'retain-on-failure' }, reporter: [['list']], });
