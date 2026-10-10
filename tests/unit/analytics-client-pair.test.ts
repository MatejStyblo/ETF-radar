import { afterEach, beforeEach, expect, test, vi } from 'vitest';
let fetchMock: ReturnType<typeof vi.fn>;
beforeEach(() => {
 vi.resetModules(); const storage = new Map<string, string>();
 vi.stubGlobal('window', new EventTarget());
 vi.stubGlobal('localStorage', { getItem: (k: string) => storage.get(k) ?? null, setItem: (k: string, v: string) => storage.set(k, v), removeItem: (k: string) => storage.delete(k) });
 fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 200 })); vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => vi.unstubAllGlobals());
test.each(['unset', 'denied'])('selection with %s consent sends no POST payload', async preference => {
 const client = await import('@/lib/analytics/client'); client.initializeMeasurement();
 if (preference === 'denied') client.setMeasurement(false);
 await client.track('etf_selected', ['spy', 'ivv']);
 expect(fetchMock.mock.calls.filter(([, options]) => options.method === 'POST')).toHaveLength(0);
});
test.each([
 ['etf_selected', ['spy', 'spy']], ['results_viewed', ['spy', 'ivv']],
 ['etf_selected', ['spy', 'private@example.invalid']], ['etf_selected', ['spy', 'ivv', 'cspx']],
] as const)('invalid pair context never leaves the browser (%s %j)', async (name, pair) => {
 const client = await import('@/lib/analytics/client'); client.initializeMeasurement(); client.setMeasurement(true); await client.track('landing_view'); fetchMock.mockClear();
 await client.track(name, pair as unknown as ['spy', 'ivv']);
 expect(fetchMock).not.toHaveBeenCalled();
});
test('withdrawal cancels queued pair selection', async () => {
 const client = await import('@/lib/analytics/client'); client.initializeMeasurement(); client.setMeasurement(true); await client.track('landing_view'); fetchMock.mockClear();
 const queued = client.track('etf_selected', ['spy', 'ivv']); client.setMeasurement(false); await queued;
 expect(fetchMock.mock.calls.filter(([, options]) => options.method === 'POST')).toHaveLength(0);
});
test('consented selection sends only a snapshotted pair in the existing session envelope', async () => {
 const client = await import('@/lib/analytics/client'); client.initializeMeasurement('b'); client.setMeasurement(true);
 const pair: ['spy', 'cspx'] = ['spy', 'cspx'];
 const queued = client.track('etf_selected', pair); pair.reverse(); await queued;
 const bodies = fetchMock.mock.calls.map(([, options]) => JSON.parse(options.body));
 expect(bodies[0]).not.toHaveProperty('etfIds');
 expect(bodies[1]).toEqual({ eventId: expect.any(String), name: 'etf_selected', adVariant: 'b', consent: true, etfIds: ['spy', 'cspx'] });
});
