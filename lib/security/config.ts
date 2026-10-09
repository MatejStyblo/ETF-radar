import 'server-only';
export function requireConfig() {
 const { DATABASE_URL, APP_ORIGIN, LEAD_DEDUPE_SECRET, REPORT_TOKEN_SECRET, LEADS_ENABLED, CONTROLLER_NAME, PRIVACY_CONTACT } = process.env;
 if (!DATABASE_URL || !APP_ORIGIN || !LEAD_DEDUPE_SECRET || LEAD_DEDUPE_SECRET.length < 32 || !REPORT_TOKEN_SECRET || REPORT_TOKEN_SECRET.length < 32 || LEADS_ENABLED !== 'true' || !CONTROLLER_NAME?.trim() || !PRIVACY_CONTACT?.trim()) throw new Error('Capture unavailable');
 const origin = new URL(APP_ORIGIN).origin;
 return { origin, dedupeSecret: LEAD_DEDUPE_SECRET, tokenSecret: REPORT_TOKEN_SECRET };
}
