export type EtfId = "spy" | "ivv" | "cspx";
export type Etf = {
  id: EtfId; ticker: string; name: string; issuer: string; isin: string | null;
  index: string; chargePct: number; chargeLabel: string; exchange: string;
  tradingCurrency: string; shareClassCurrency: string | null; domicile: string | null;
  income: string; structure: string; ucits: boolean; role: "us-reference" | "eu-comparison";
  availability: string; sourceUrl: string; retrievedAt: string; aum: null;
};
export const DATA_VERSION = "2026-10-09.1";
export const ETFs: readonly Etf[] = [
  { id: "spy", ticker: "SPY", name: "State Street SPDR S&P 500 ETF Trust", issuer: "State Street", isin: "US78462F1030", index: "S&P 500", chargePct: 0.0945, chargeLabel: "Gross Expense Ratio", exchange: "NYSE Arca", tradingCurrency: "USD", shareClassCurrency: null, domicile: null, income: "Distribuční · čtvrtletně", structure: "Unit investment trust", ucits: false, role: "us-reference", availability: "Americký referenční fond. Dostupnost pro český retail není ověřena; ověřte PRIIPs KID a podmínky brokera.", sourceUrl: "https://www.ssga.com/us/en/individual/etfs/state-street-spdr-sp-500-etf-trust-spy", retrievedAt: "2026-10-09", aum: null },
  { id: "ivv", ticker: "IVV", name: "iShares Core S&P 500 ETF", issuer: "BlackRock / iShares", isin: null, index: "S&P 500", chargePct: 0.03, chargeLabel: "Expense Ratio", exchange: "NYSE Arca", tradingCurrency: "USD", shareClassCurrency: null, domicile: null, income: "Distribuční · čtvrtletně", structure: "ETF; právní forma zde neověřena", ucits: false, role: "us-reference", availability: "Americký referenční fond. Dostupnost pro český retail není ověřena; ověřte PRIIPs KID a podmínky brokera.", sourceUrl: "https://www.ishares.com/us/products/239726/ishares-core-sp-500-etf-ivv", retrievedAt: "2026-10-09", aum: null },
  { id: "cspx", ticker: "CSPX", name: "iShares Core S&P 500 UCITS ETF USD (Acc)", issuer: "BlackRock / iShares", isin: "IE00B5BMR087", index: "S&P 500", chargePct: 0.07, chargeLabel: "TER", exchange: "London Stock Exchange", tradingCurrency: "USD", shareClassCurrency: "USD", domicile: "Irsko", income: "Akumulační", structure: "UCITS · fyzická replikace", ucits: true, role: "eu-comparison", availability: "Evropská UCITS varianta, není NYSE-listed. Konkrétní dostupnost a KID pro českého investora ověřte u brokera.", sourceUrl: "https://www.ishares.com/uk/individual/en/products/253743/ishares-sp-500-b-ucits-etf-acc-fund", retrievedAt: "2026-10-09", aum: null },
];
export function getEtf(id: EtfId): Etf {
  const fund = ETFs.find((etf) => etf.id === id);
  if (!fund) throw new Error("Neznámý fond");
  return fund;
}
