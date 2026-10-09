import 'server-only';
import { Pool } from 'pg';
let pool: Pool | undefined;
export function getPool(): Pool {
 if (!process.env.DATABASE_URL) throw new Error('Database unavailable');
 return pool ??= new Pool({ connectionString: process.env.DATABASE_URL, max: 5, connectionTimeoutMillis: 3000, idleTimeoutMillis: 10000, statement_timeout: 5000 });
}
export async function closePool() { const current = pool; pool = undefined; await current?.end(); }
