import { expect, test, vi } from 'vitest';
import { randomUUID } from 'node:crypto';
import { acquisitionSchema, readAcquisition } from '@/lib/analytics/acquisition';
vi.mock('server-only', () => ({}));

test('extracts campaign labels and only an external referrer hostname', () => {
 expect(readAcquisition('http://localhost/?utm_source=facebook&utm_medium=paid_social&utm_campaign=test&utm_content=a', 'https://www.google.com/search?q=private@example.invalid'))
  .toEqual({ utm_source: 'facebook', utm_medium: 'paid_social', utm_campaign: 'test', utm_content: 'a', referrer_host: 'www.google.com' });
 expect(readAcquisition('http://localhost/', 'http://localhost/report')).toEqual({});
 expect(readAcquisition('http://localhost/', '')).toEqual({});
});
test('rejects duplicate, personal, oversized and malformed acquisition values', () => {
 expect(readAcquisition('http://localhost/?utm_source=a&utm_source=b&utm_campaign=private@example.invalid&utm_content='+ 'a'.repeat(65), 'javascript:alert(1)')).toEqual({});
 expect(readAcquisition('http://localhost/', 'https://user:password@example.com/')).toEqual({});
 expect(acquisitionSchema.safeParse({ referrer_host: 'https://example.com/private' }).success).toBe(false);
 expect(acquisitionSchema.safeParse({ email: 'private@example.invalid' }).success).toBe(false);
});
test('event schema allows acquisition only on consented landing views', async () => {
 const { eventSchema } = await import('@/lib/db/analytics');
 const event = {eventId: randomUUID(), name: 'landing_view', adVariant: 'a', consent: true, acquisition: {utm_source:'facebook'}};
 expect(eventSchema.safeParse(event).success).toBe(true);
 expect(eventSchema.safeParse({...event, consent:false}).success).toBe(false);
 expect(eventSchema.safeParse({...event, name:'report_viewed'}).success).toBe(false);
});
