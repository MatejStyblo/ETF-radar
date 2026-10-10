import { randomUUID } from 'node:crypto';
import { expect, test, vi } from 'vitest';
vi.mock('server-only', () => ({}));
const { eventSchema } = await import('@/lib/db/analytics');
const event = { eventId: randomUUID(), name: 'etf_selected', adVariant: 'a', consent: true };
test('selection accepts an ordered allowlisted distinct ETF pair and legacy omission', () => {
 expect(eventSchema.parse({ ...event, etfIds: ['cspx', 'spy'] }).etfIds).toEqual(['cspx', 'spy']);
 expect(eventSchema.parse(event)).toEqual(event);
});
test.each([
 { etfIds: ['spy', 'spy'] },
 ...['session_start','landing_view','primary_cta_click','comparison_started','calculator_interaction','results_viewed','lead_offer_viewed','lead_form_started','lead_submit_attempt','lead_submit_error','report_viewed','report_downloaded'].map(name => ({ name, etfIds: ['spy', 'ivv'] })),
 { etfIds: ['spy', 'qqq'] }, { etfIds: ['spy', 'x@example.invalid'] }, { etfIds: ['https://example.invalid', 'ivv'] },
 { etfIds: ['spy'] }, { etfIds: ['spy', 'ivv', 'cspx'] }, { etfIds: null },
 { etfIds: ['spy', 'ivv'], email: 'x@example.invalid' }, { etfIds: ['spy', 'ivv'], initial: 100000 },
 { etfIds: ['spy', 'ivv'], consent: false },
])('rejects unsafe or irrelevant selection context %j', overrides => {
 expect(eventSchema.safeParse({ ...event, ...overrides }).success).toBe(false);
});
