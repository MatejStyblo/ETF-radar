import 'server-only';
import { timingSafeEqual } from 'node:crypto';
import { hmac } from './tokens';
import { requireConfig } from './config';
export function signSession(id: string) {
 const body = `${id}.${Date.now() + 1800000}`;
 return `${body}.${hmac(`analytics:${body}`, requireConfig().tokenSecret)}`;
}
export function readSession(request: Request): string | null {
 const raw = request.headers.get('cookie')?.split(';').map(part => part.trim()).find(part => part.startsWith('etf_analytics='))?.slice('etf_analytics='.length) ?? '';
 const match = /^([a-f0-9-]{36})\.(\d{13})\.([a-f0-9]{64})$/.exec(raw);
 if (!match || Number(match[2]) <= Date.now()) return null;
 const expected = hmac(`analytics:${match[1]}.${match[2]}`, requireConfig().tokenSecret);
 return timingSafeEqual(Buffer.from(match[3]), Buffer.from(expected)) ? match[1] : null;
}
