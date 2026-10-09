import { expect, it } from "vitest";
import { buildReport } from "@/lib/report/model";
import { renderReportHtml } from "@/lib/report/html";

it("fulfills the actual detailed offer in a standalone downloadable document", () => {
  const report = buildReport({ initial: 100000, monthly: 3000, years: 20, grossReturnPct: 5 }, ["spy", "cspx"]);
  const html = renderReportHtml(report);
  expect(html).toContain('<html lang="cs">');
  expect(html).toContain("5 let");
  expect(html).toContain("30 let");
  expect(html).toContain("Checklist před nákupem");
  expect(html).toContain("NYSE Arca");
  expect(html).toContain("London Stock Exchange");
  expect(html).toContain("IE00B5BMR087");
  expect(html).toContain("Model, ne předpověď");
  expect(html).toContain("https://www.ssga.com/");
  expect(html).not.toContain("<script");
});

it("escapes source text instead of executing markup", () => {
  const report = buildReport({ initial: 0, monthly: 100, years: 1, grossReturnPct: 0 }, ["spy", "ivv"]);
  const untrusted = { ...report, etfs: [{ ...report.etfs[0], name: '<script>alert("x")</script>' }, report.etfs[1]] as typeof report.etfs };
  const html = renderReportHtml(untrusted);
  expect(html).toContain("&lt;script&gt;");
  expect(html).not.toContain("<script");
});
