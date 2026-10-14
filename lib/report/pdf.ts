import 'server-only';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import fontkit from '@pdf-lib/fontkit';
import { PDFDocument, PDFName, PDFString, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import { money, percent } from '@/lib/format';
import { indexComparisonWarning, type PersonalReport } from './model';

const ink = rgb(.04, .09, .2);
const muted = rgb(.31, .4, .49);
const accent = rgb(0, .46, .49);
const line = rgb(.83, .88, .92);
const pale = rgb(.94, .97, .98);
const margin = 44;
const pageWidth = 595.28;
const pageHeight = 841.89;
const width = pageWidth - margin * 2;
let fontFiles: Promise<[Buffer, Buffer]> | undefined;
const normalize = (text: string) => text.replace(/\u00a0/g, ' ').replace(/[\u2010-\u2015\u2212]/g, '-');

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const result: string[] = [];
  for (const paragraph of normalize(text).split('\n')) {
    let current = '';
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      if (current && font.widthOfTextAtSize(`${current} ${word}`, size) <= maxWidth) { current += ` ${word}`; continue; }
      if (current) { result.push(current); current = ''; }
      if (font.widthOfTextAtSize(word, size) <= maxWidth) { current = word; continue; }
      for (const char of word) {
        if (current && font.widthOfTextAtSize(current + char, size) > maxWidth) { result.push(current); current = ''; }
        current += char;
      }
    }
    result.push(current);
  }
  return result;
}

/** Server-only, standalone A4 PDF of the persisted snapshot. No email, token or remote font fetch. */
export async function renderReportPdf(report: PersonalReport): Promise<Uint8Array> {
  const files = await (fontFiles ??= Promise.all([
    readFile(join(process.cwd(), 'assets/fonts/NotoSans-Regular.ttf')),
    readFile(join(process.cwd(), 'assets/fonts/NotoSans-Bold.ttf')),
  ]));
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const [regular, bold] = await Promise.all(files.map(bytes => pdf.embedFont(bytes, { subset: true })));
  const [a, b] = report.etfs;
  const [pa, pb] = report.selected;
  pdf.setTitle(`Vaše ETF srovnání - ${a.ticker} / ${b.ticker}`);
  pdf.setAuthor('ETF Radar');
  pdf.setCreator('ETF Radar');
  pdf.setSubject('Osobní model nákladů, srovnání fondů a checklist');
  pdf.catalog.set(PDFName.of('Lang'), PDFString.of('cs-CZ'));
  let page: PDFPage;
  let y = 0;
  function newPage() {
    page = pdf.addPage([pageWidth, pageHeight]);
    page.drawRectangle({ x: margin, y: pageHeight - 36, width, height: 3, color: accent });
    page.drawText('ETF RADAR / VAŠE SROVNÁNÍ', { x: margin, y: pageHeight - 55, size: 9, font: bold, color: accent });
    const pair = `${a.ticker} / ${b.ticker}`;
    page.drawText(pair, { x: pageWidth - margin - bold.widthOfTextAtSize(pair, 9), y: pageHeight - 55, size: 9, font: bold, color: muted });
    y = pageHeight - 83;
  }
  function ensure(height: number) { if (y - height < 66) newPage(); }
  function text(value: string, size = 9.5, isBold = false, color = ink, gap = 9) {
    const font = isBold ? bold : regular;
    for (const row of wrap(value, font, size, width)) {
      ensure(size * 1.5);
      page.drawText(row, { x: margin, y: y - size, size, font, color });
      y -= size * 1.5;
    }
    y -= gap;
  }
  function heading(value: string) {
    ensure(72);
    y -= 12;
    text(value, 14, true, ink, 13);
  }
  function table(headers: string[], rows: string[][], ratios: number[]) {
    const widths = ratios.map(ratio => ratio * width);
    function row(cells: string[], header: boolean, index: number) {
      const font = header ? bold : regular;
      const size = header ? 8 : 8.5;
      const leading = 12;
      const lines = cells.map((cell, i) => wrap(cell, font, size, widths[i] - 16));
      const height = Math.max(...lines.map(list => list.length)) * leading + 16;
      if (y - height < 66) { newPage(); if (!header) row(headers, true, 0); }
      if (header || index % 2 === 0) page.drawRectangle({ x: margin, y: y - height, width, height, color: pale });
      let x = margin;
      lines.forEach((list, i) => {
        list.forEach((value, j) => page.drawText(value, { x: x + 8, y: y - 16 - j * leading, size, font, color: header ? accent : ink }));
        x += widths[i];
      });
      page.drawLine({ start: { x: margin, y: y - height }, end: { x: pageWidth - margin, y: y - height }, thickness: .5, color: line });
      y -= height;
    }
    ensure(84);
    row(headers, true, 0);
    rows.forEach((cells, i) => row(cells, false, i));
    y -= 14;
  }
  newPage();
  text('Vaše ETF. Váš scénář.', 26, true, ink, 5);
  text('Náklady, více horizontů a otázky před nákupem.', 11, false, muted, 14);
  const generated = new Intl.DateTimeFormat('cs-CZ', { timeZone: 'Europe/Prague', dateStyle: 'long' }).format(new Date(report.generatedAt));
  text(`Vytvořeno ${generated} | Katalog ${report.version}`, 8, false, muted);

  heading('01 / Vaše modelová investice');
  table(['Počáteční vklad', 'Měsíční příspěvek', 'Horizont', 'Hrubý výnos'], [[money(report.scenario.initial), money(report.scenario.monthly), `${report.scenario.years} let`, `${percent(report.scenario.grossReturnPct)} ročně`]], [.28, .28, .18, .26]);
  text('Hypotetický model, nikoli předpověď nebo garantované zhodnocení. Kč jsou modelová jednotka; měnové kurzy nepočítáme.', 9, false, muted);

  heading('02 / Výsledek vašeho scénáře');
  text(`Celkem vloženo: ${money(pa.contributed)}. Bez průběžných nákladů: ${money(pa.baseline)}.`, 10, true);
  table(['Fond', 'Roční náklad', 'Modelový zůstatek', 'Dopad nákladů'], [
    [a.ticker, percent(a.chargePct), money(pa.balance), money(pa.costImpact)],
    [b.ticker, percent(b.chargePct), money(pb.balance), money(pb.costImpact)],
  ], [.15, .2, .34, .31]);
  text(`Modelový rozdíl: ${money(Math.abs(pa.balance - pb.balance))}. Dopad zahrnuje také ušlé složené zhodnocení, nikoli jen stržené poplatky.`, 10, true, accent);
  const warning = indexComparisonWarning(report.etfs);
  if (warning) text(warning, 9, false, muted);

  heading('03 / Jak se scénář mění s časem');
  table(['Horizont', 'Celkem vloženo', `${a.ticker} / zůstatek`, `${b.ticker} / zůstatek`], report.horizons.map(h => [`${h.years} let`, money(h.results[0].contributed), money(h.results[0].balance), money(h.results[1].balance)]), [.14, .28, .29, .29]);

  newPage();
  heading('04 / Detailní srovnání fondů');
  const unknown = 'Neověřeno v tomto katalogu';
  table(['Vlastnost', a.ticker, b.ticker], [
    ['Název', a.name, b.name], ['Značka / poskytovatel', a.issuer, b.issuer],
    ['ISIN', a.isin ?? unknown, b.isin ?? unknown], ['Index', a.index, b.index],
    ['Roční náklad', `${percent(a.chargePct)} (${a.chargeLabel})`, `${percent(b.chargePct)} (${b.chargeLabel})`],
    ['Přesný listing', a.exchange, b.exchange], ['Obchodní měna', a.tradingCurrency, b.tradingCurrency],
    ['Měna share class', a.shareClassCurrency ?? unknown, b.shareClassCurrency ?? unknown],
    ['Domicil', a.domicile ?? unknown, b.domicile ?? unknown], ['Nakládání s výnosy', a.income, b.income],
    ['Struktura', a.structure, b.structure], ['UCITS', a.ucits ? 'Ano' : 'Ne', b.ucits ? 'Ano' : 'Ne'],
    ['Velikost fondu', unknown, unknown],
  ], [.26, .37, .37]);
  heading('05 / Dostupnost a důležité rozdíly');
  for (const fund of report.etfs) {
    text(`${fund.ticker}: ${fund.availability}`);
    if (fund.indexNote) text(fund.indexNote, 8.5, false, muted);
  }
  text('NYSE Arca není hlavní NYSE. CSPX je evropský UCITS doplněk na LSE. Listing ani UCITS status nezaručují dostupnost u konkrétního brokera. Obchodní měna není měnová expozice.', 9, false, muted);

  newPage();
  heading('06 / Checklist před nákupem');
  report.checklist.forEach((item, i) => text(`${i + 1}. ${item}`));
  heading('07 / Rok po roce');
  table(['Rok', 'Vloženo', 'Bez nákladů', a.ticker, b.ticker], pa.annual.map((point, i) => [String(point.year), money(point.contributed), money(point.baseline), money(point.balance), money(pb.annual[i].balance)]), [.08, .23, .23, .23, .23]);

  newPage();
  heading('08 / Zdroje a předpoklady');
  for (const fund of report.etfs) {
    text(`${fund.ticker} - ${fund.name}`, 10, true);
    text(`Katalog načten ${fund.retrievedAt}; nejde o datum vydání dokumentu.`, 8.5, false, muted, 4);
    for (const url of [fund.sourceUrl, ...(fund.sourceUrls ?? [])]) {
      if (new URL(url).protocol !== 'https:') throw new Error('Report source must use HTTPS');
      text(url, 8, false, accent, 7);
    }
  }
  text('PRIIPs a KID - Evropská komise:', 9, true);
  text('https://finance.ec.europa.eu/consumer-finance-and-payments/retail-financial-services/key-information-documents-packaged-retail-and-insurance-based-investment-products-priips_en', 8, false, accent);
  heading('Předpoklady modelu');
  report.assumptions.forEach(item => text(item, 9));
  text('Vzdělávací srovnání, nikoli individuální investiční poradenství. Investování nese riziko ztráty. Report se neposílá emailem. Tento soubor neobsahuje váš email ani přístupový token.', 9, false, muted);

  const pages = pdf.getPages();
  pages.forEach((p, i) => {
    p.drawLine({ start: { x: margin, y: 48 }, end: { x: pageWidth - margin, y: 48 }, color: line, thickness: .5 });
    p.drawText('ETF Radar | Model, ne předpověď', { x: margin, y: 32, font: regular, size: 8, color: muted });
    const label = `${i + 1} / ${pages.length}`;
    p.drawText(label, { x: pageWidth - margin - regular.widthOfTextAtSize(label, 8), y: 32, font: regular, size: 8, color: muted });
  });
  return pdf.save();
}
