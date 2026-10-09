import { Pool } from 'pg';
import { readdir, readFile } from 'node:fs/promises';
const pool = new Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 3000 });
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
const client = await pool.connect();
try {
 await client.query('BEGIN');
 await client.query("SELECT pg_advisory_xact_lock(hashtext('etf_radar_migrations'))");
 const dir = new URL('../lib/db/migrations/', import.meta.url);
 for (const name of (await readdir(dir)).filter(n => n.endsWith('.sql')).sort()) await client.query(await readFile(new URL(name, dir), 'utf8'));
 await client.query('COMMIT');
 console.log('Migrations applied');
} catch (error) { await client.query('ROLLBACK'); throw error; }
finally { client.release(); await pool.end(); }
