import { afterEach, expect, test, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { eventSchema } from '@/lib/db/analytics';
import { ETF_IDS } from '@/data/etfs';
import { etfPairSchema } from '@/lib/validation/schemas';
const event = { eventId: '00000000-0000-4000-8000-000000000001', name: 'etf_selected', adVariant: 'a', consent: true };
afterEach(() => vi.unstubAllGlobals());
test('every distinct catalog pair remains accepted by selection and server analytics', () => {
 for (const a of ETF_IDS) for (const b of ETF_IDS) {
  expect(etfPairSchema.safeParse([a,b]).success).toBe(a !== b);
  expect(eventSchema.safeParse({...event, etfIds: [a,b]}).success).toBe(a !== b);
 }
 for (const body of [{...event,etfIds:['stxf','email@example.invalid']},{...event,etfIds:['stxf','stxg'],email:'x@example.invalid'},{...event,name:'results_viewed',etfIds:['stxf','stxg']}]) expect(eventSchema.safeParse(body).success).toBe(false);
});
test('client sends new ordered allowlisted pair but rejects duplicates and arbitrary identifiers', async () => {
 vi.resetModules(); const storage = new Map<string,string>();
 vi.stubGlobal('window',new EventTarget());
 vi.stubGlobal('localStorage',{getItem:(key:string)=>storage.get(key)??null,setItem:(key:string,value:string)=>storage.set(key,value),removeItem:(key:string)=>storage.delete(key)});
 const fetch = vi.fn().mockResolvedValue(new Response(null,{status:200})); vi.stubGlobal('fetch',fetch);
 const client = await import('@/lib/analytics/client'); const stop = client.initializeMeasurement(); client.setMeasurement(true); await client.track('landing_view'); fetch.mockClear();
 await client.track('etf_selected',['stxf','stxg']);
 expect(fetch.mock.calls.map(([,options])=>JSON.parse(options.body))).toEqual([{...event,eventId:expect.any(String),etfIds:['stxf','stxg']}]);
 fetch.mockClear(); await client.track('etf_selected',['stxf','stxf']); await client.track('etf_selected',['stxf','email@example.invalid'] as never);
 expect(fetch).not.toHaveBeenCalled(); stop();
});
