import { describe, expect, it } from 'vitest';
import config from '../../next.config';

describe('private dashboard response headers', () => {
 it('marks dashboard pages and exports as no-store and noindex', async () => {
  const routes = await config.headers!();
  const dashboard = routes.find(route => route.source === '/dashboard/:path*');
  expect(dashboard?.headers).toEqual(expect.arrayContaining([
   { key: 'Cache-Control', value: 'private, no-store, max-age=0' },
   { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
  ]));
 });
});
