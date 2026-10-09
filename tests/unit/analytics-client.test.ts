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
