// Supply the cached Lighthouse module path; no dependency is added to the app.
import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

assert.ok(process.argv[2], 'Provide an installed lighthouse/core/index.js path');
const { default: lighthouse } = await import(pathToFileURL(process.argv[2]).href);
const origin = process.env.AUDIT_ORIGIN ?? 'https://etf-radar-dun.vercel.app';
const output = process.env.AUDIT_OUTPUT ?? 'docs/qa/final-audit';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ args: ['--remote-debugging-port=9225'] });
try {
  const result = await lighthouse(origin, { port: 9225, output: ['json', 'html'], onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'] });
  await writeFile(`${output}/lighthouse-production.json`, result.report[0]);
  await writeFile(`${output}/lighthouse-production.html`, result.report[1]);
  const lhr = result.lhr;
  const summary = { url: lhr.finalDisplayedUrl, checkedAt: lhr.fetchTime, version: lhr.lighthouseVersion, scores: Object.fromEntries(Object.entries(lhr.categories).map(([name, data]) => [name, data.score * 100])), metrics: Object.fromEntries(['largest-contentful-paint', 'cumulative-layout-shift', 'total-blocking-time', 'first-contentful-paint'].map(name => [name, { value: lhr.audits[name].numericValue, unit: lhr.audits[name].numericUnit }])), warnings: lhr.runWarnings, runtimeError: lhr.runtimeError ?? null, failedAudits: Object.entries(lhr.audits).filter(([, data]) => data.score !== null && data.score < 1 && data.scoreDisplayMode !== 'informative').map(([id, data]) => ({ id, title: data.title, score: data.score })) };
  await writeFile(`${output}/lighthouse-summary.json`, JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
} finally { await browser.close(); }
