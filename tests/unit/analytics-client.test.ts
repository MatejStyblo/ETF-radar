import { afterEach, beforeEach, expect, test, vi } from 'vitest';

let storage: Map<string, string>;
let browser: EventTarget;
let fetchMock: ReturnType<typeof vi.fn>;
beforeEach(() => {
 vi.resetModules();
 storage = new Map(); browser = new EventTarget();
 vi.stubGlobal('window', browser);
 vi.stubGlobal('localStorage', { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value), removeItem: (key: string) => storage.delete(key) });
 fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
 vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });
function withdrawInOtherTab() {
 storage.set('etf-radar-measurement', 'denied');
 const event = Object.assign(new Event('storage'), { key: 'etf-radar-measurement', newValue: 'denied' });
 browser.dispatchEvent(event);
}
test('report-only initialization establishes consented measurement without a landing view', async () => {
 storage.set('etf-radar-measurement', 'allowed');
 const client = await import('@/lib/analytics/client');
 client.initializeMeasurement(undefined, 'report');
 await client.track('report_viewed');
 const events = fetchMock.mock.calls.map(([, options]) => JSON.parse(options.body));
 expect(events.map(event => event.name)).toEqual(['session_start', 'report_viewed']);
 expect(events.every(event => Object.keys(event).sort().join(',') === 'adVariant,consent,eventId,name')).toBe(true);
});

test.each(['unset', 'denied'] as const)('report initialization with %s preference sends nothing before opt-in', async preference => {
 if (preference === 'denied') storage.set('etf-radar-measurement', 'denied');
 const client = await import('@/lib/analytics/client');
 client.initializeMeasurement(undefined, 'report');
 await client.track('report_viewed');
 expect(fetchMock.mock.calls.filter(([, options]) => options.method === 'POST')).toHaveLength(0);
 client.setMeasurement(true); await client.track('report_viewed');
 expect(fetchMock.mock.calls.filter(([, options]) => options.method === 'POST').map(([, options]) => JSON.parse(options.body).name)).toEqual(['session_start', 'report_viewed']);
});

test('report session renewal never emits landing_view', async () => {
 storage.set('etf-radar-measurement', 'allowed');
 const client = await import('@/lib/analytics/client');
 client.initializeMeasurement(undefined, 'report'); await client.track('report_viewed');
 fetchMock.mockClear(); fetchMock.mockResolvedValueOnce(new Response(null, { status: 401 }));
 await client.track('report_downloaded'); await client.track('report_viewed');
 expect(fetchMock.mock.calls.map(([, options]) => JSON.parse(options.body).name)).toEqual(['report_downloaded', 'session_start', 'report_viewed']);
});

test('report-to-landing navigation emits the actual landing view and preserves landing events', async () => {
 storage.set('etf-radar-measurement', 'allowed');
 const client = await import('@/lib/analytics/client');
 client.initializeMeasurement(undefined, 'report'); await client.track('report_viewed');
 fetchMock.mockClear();
 client.initializeMeasurement('b', 'landing'); await client.track('comparison_started');
 client.initializeMeasurement('b', 'landing'); await client.track('calculator_interaction');
 expect(fetchMock.mock.calls.map(([, options]) => JSON.parse(options.body).name)).toEqual(['landing_view', 'comparison_started', 'calculator_interaction']);
 expect(fetchMock.mock.calls.every(([, options]) => JSON.parse(options.body).adVariant === 'b')).toBe(true);
});

test('failed revocation remains pending and retries without resuming denied measurement', async () => {
 vi.useFakeTimers();
 const client = await import('@/lib/analytics/client');
 client.initializeMeasurement(); client.setMeasurement(true); await client.track('landing_view');
 fetchMock.mockClear(); fetchMock.mockResolvedValueOnce(new Response(null, { status: 503 }));
 client.setMeasurement(false);
 await vi.advanceTimersByTimeAsync(0);
 expect(storage.get('etf-radar-measurement-revocation')).toBe('pending');
 expect(client.measurementSnapshot()).toBe('denied');
 await client.track('lead_submit_attempt');
 expect(fetchMock.mock.calls.filter(([, options]) => options.method === 'POST')).toHaveLength(0);
 await vi.advanceTimersByTimeAsync(5000);
 expect(fetchMock.mock.calls.filter(([, options]) => options.method === 'DELETE')).toHaveLength(2);
 expect(storage.has('etf-radar-measurement-revocation')).toBe(false);
});

test('initialization resumes a persisted pending revocation', async () => {
 storage.set('etf-radar-measurement', 'allowed');
 storage.set('etf-radar-measurement-revocation', 'pending');
 const client = await import('@/lib/analytics/client');
 client.initializeMeasurement();
 await vi.waitFor(() => expect(storage.has('etf-radar-measurement-revocation')).toBe(false));
 expect(fetchMock.mock.calls.filter(([, options]) => options.method === 'DELETE')).toHaveLength(1);
});

test('pending revocation precedes renewed opt-in and blocks events until acknowledged', async () => {
 vi.useFakeTimers();
 const client = await import('@/lib/analytics/client');
 client.initializeMeasurement(); client.setMeasurement(true); await client.track('landing_view');
 fetchMock.mockClear(); fetchMock.mockResolvedValue(new Response(null, { status: 503 }));
 client.setMeasurement(false); await vi.advanceTimersByTimeAsync(0);
 client.setMeasurement(true); await client.track('calculator_interaction');
 expect(fetchMock.mock.calls.filter(([, options]) => options.method === 'POST')).toHaveLength(0);
 fetchMock.mockResolvedValue(new Response(null, { status: 200 }));
 await vi.advanceTimersByTimeAsync(5000); await client.track('calculator_interaction');
 expect(fetchMock.mock.calls.filter(([, options]) => options.method === 'POST').map(([, options]) => JSON.parse(options.body).name)).toEqual(['landing_view', 'calculator_interaction']);
});

test('capture consent reads current storage before a delayed cross-tab storage event', async () => {
 const client = await import('@/lib/analytics/client');
 client.initializeMeasurement(); client.setMeasurement(true); await client.track('landing_view');
 storage.set('etf-radar-measurement', 'denied');
 expect(client.measurementConsent()).toBe(false);
});

test('a 401 after idle invalidates readiness so the next consented event renews the session', async () => {
 const client = await import('@/lib/analytics/client');
 client.initializeMeasurement(); client.setMeasurement(true); await client.track('landing_view');
 fetchMock.mockClear(); fetchMock.mockResolvedValueOnce(new Response(null, { status: 401 }));
 await client.track('calculator_interaction'); await client.track('etf_selected');
 expect(fetchMock.mock.calls.map(([, options]) => JSON.parse(options.body).name)).toEqual(['calculator_interaction', 'landing_view', 'etf_selected']);
});

test('cross-tab withdrawal stops initialized clients and invalidates queued events', async () => {
 const client = await import('@/lib/analytics/client');
 client.initializeMeasurement(); client.setMeasurement(true); await client.track('landing_view');
 fetchMock.mockClear();
 const queued = client.track('calculator_interaction');
 withdrawInOtherTab(); await queued;
 expect(client.measurementSnapshot()).toBe('denied');
 await client.track('etf_selected');
 expect(fetchMock.mock.calls.filter(([, options]) => options.method === 'POST')).toHaveLength(0);
});
