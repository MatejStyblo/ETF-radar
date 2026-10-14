// Reproducible ad artwork using a screenshot of the real, running comparison.
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const origin = process.env.ADS_ORIGIN ?? 'http://127.0.0.1:3141';
const output = 'docs/ads';
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
  await page.goto(origin);
  await page.getByTestId('model-difference').waitFor();
  await page.getByRole('button', { name: 'Odmítnout', exact: true }).click();
  const overview = page.locator('.fund-overview');
  const box = await overview.boundingBox();
  const screenshot = await overview.screenshot();
  const image = `data:image/png;base64,${screenshot.toString('base64')}`;
  const imageHeight = 936 * box.height / box.width;
  for (const [variant, headline, subtitle, cta, angle] of [
    ['a', ['Malý roční', 'poplatek.', 'Jaký rozdíl udělá za 20 let?'], 'Vlastní vklady. Vlastní horizont. Jasné předpoklady.', 'Porovnat náklady', 'NÁKLADY V ČASE'],
    ['b', ['ETF na NYSE', 'nejsou všechna', 'stejná.'], 'Dva fondy. Odlišné indexy. Přehled na jednom místě.', 'Porovnat ETF', 'ORIENTACE VE FONDECH'],
  ]) {
    const lines = headline.map((line, index) => `<text x="72" y="292" dy="${index * 100}" font-size="${variant === 'a' && index === 2 ? 58 : 84}" fill="${index === 2 ? '#00d1ee' : '#edf4ff'}" font-weight="700">${line}</text>`).join('');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1080" height="1350" viewBox="0 0 1080 1350" role="img" aria-labelledby="title desc">
      <title id="title">ETF Radar — reklama ${variant.toUpperCase()}</title><desc id="desc">${headline.join(' ')} ${subtitle} Hypotetický model, ne předpověď. Fondy mají odlišné indexy.</desc>
      <rect width="1080" height="1350" fill="#080d15"/>
      <g font-family="Arial, sans-serif">
      <rect x="72" y="76" width="32" height="32" rx="16" fill="none" stroke="#00d1ee" stroke-width="3"/><circle cx="88" cy="92" r="5" fill="#00d1ee"/>
      <text x="124" y="104" font-size="36" font-weight="700" fill="#edf4ff">ETF Radar</text>
      <text x="72" y="186" font-size="20" letter-spacing="4" fill="#9bacc5">${angle}</text>
      ${lines}
      <text x="72" y="562" font-size="25" fill="#b5c8e8">${subtitle}</text>
      <rect x="60" y="608" width="960" height="${imageHeight + 24}" rx="12" fill="#0e1524" stroke="#253249" stroke-width="2"/>
      <image x="72" y="620" width="936" height="${imageHeight}" xlink:href="${image}"/>
      <text x="72" y="${Math.max(985, 656 + imageHeight)}" font-size="22" fill="#9bacc5">Skutečné fondy. Výpočet bez registrace.</text>
      <rect x="72" y="1060" width="936" height="104" rx="8" fill="#00d1ee"/>
      <text x="112" y="1125" font-size="34" font-weight="700" fill="#05141e">${cta}</text>
      <text x="916" y="1125" font-size="38" fill="#05141e">↗</text>
      <text x="72" y="1222" font-size="22" fill="#9bacc5">Hypotetický model nákladů, ne předpověď výnosů.</text>
      <text x="72" y="1258" font-size="22" fill="#9bacc5">Odlišné indexy. Dostupnost a PRIIPs KID ověřte u brokera.</text>
      <text x="72" y="1300" font-size="18" fill="#9bacc5">Návrh reklamy pro výběrové zadání · kampaň nebyla spuštěna</text>
      </g>
    </svg>`;
    await writeFile(`${output}/ad-${variant}.svg`, svg);
    await page.setContent(`<html><body style="margin:0"><img width="1080" height="1350" alt="Reklama ${variant}" src="data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}"></body></html>`);
    await page.locator('img').evaluate(image => image.decode());
    await page.screenshot({ path: `${output}/ad-${variant}.png` });
  }
  console.log(JSON.stringify({ origin, format: '1080 × 1350', files: ['ad-a.svg', 'ad-a.png', 'ad-b.svg', 'ad-b.png'] }));
} finally { await browser.close(); }
