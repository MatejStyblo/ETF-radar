import 'server-only';
import { createHmac } from 'node:crypto';
import { requireConfig } from './config';
export function hmac(value: string, secret: string) { return createHmac('sha256', secret).update(value).digest('hex'); }
export function reportToken(attemptId: string) { return hmac(`report:${attemptId}`, requireConfig().tokenSecret); }
export function reportHash(token: string) { return hmac(`access:${token}`, requireConfig().tokenSecret); }
export function normalizeEmail(email: string) { const i = email.lastIndexOf('@'); return `${email.slice(0, i)}@${email.slice(i + 1).toLowerCase()}`; }
