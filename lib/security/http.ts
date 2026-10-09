import 'server-only';
import { requireConfig } from './config';
export class HttpError extends Error { constructor(public status: number, message: string) { super(message); } }
export function checkOrigin(request: Request) {
 if (request.headers.get('origin') !== requireConfig().origin) throw new HttpError(403, 'Požadavek není ze stejného webu.');
 if (request.headers.get('sec-fetch-site') === 'cross-site') throw new HttpError(403, 'Požadavek není ze stejného webu.');
}
export async function readJson(request: Request, maxBytes = 16384): Promise<unknown> {
 checkOrigin(request);
 if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') throw new HttpError(415, 'Vyžadujeme JSON.');
 if (Number(request.headers.get('content-length')) > maxBytes) throw new HttpError(413, 'Požadavek je příliš velký.');
 const reader = request.body?.getReader();
 if (!reader) throw new HttpError(400, 'Chybí tělo požadavku.');
 const chunks: Uint8Array[] = []; let size = 0;
 try { while (true) { const { done, value } = await reader.read(); if (done) break; size += value.byteLength; if (size > maxBytes) { await reader.cancel(); throw new HttpError(413, 'Požadavek je příliš velký.'); } chunks.push(value); } }
 finally { reader.releaseLock(); }
 try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { throw new HttpError(400, 'Neplatný JSON.'); }
}
