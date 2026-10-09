import { DATA_VERSION, getEtf, type Etf, type EtfId } from "@/data/etfs";
import { project, type Projection, type Scenario } from "@/lib/calculations/project";
import { etfPairSchema, scenarioSchema } from "@/lib/validation/schemas";

export type PersonalReport = {
  version: string; generatedAt: string; scenario: Scenario; etfs: [Etf, Etf];
  selected: [Projection, Projection]; horizons: { years: number; results: [Projection, Projection] }[];
  checklist: string[]; assumptions: string[];
};
export const ASSUMPTIONS = [
  "Model, ne předpověď nebo investiční doporučení. Stejný pevný hypotetický hrubý výnos pro oba fondy.",
  "Příspěvky na konci měsíce. Měsíční faktor = ((1 + výnos/100) × (1 − roční náklad/100))^(1/12).",
  "Distribuce jsou hypoteticky plně reinvestovány před zdaněním; daně a reinvestiční poplatky nemodelujeme.",
  "Dopad nákladů = zůstatek bez průběžných nákladů minus zůstatek s nimi; zahrnuje i ušlé složené zhodnocení, nikoliv jen stržené poplatky.",
  "Kč jsou modelová jednotka vkladů a výsledků, ne měnová předpověď. Obchodní měna není měnová expozice.",
  "Nezahrnujeme brokerage, spread, FX poplatky, daně, inflaci, tracking difference ani kolísání výnosů.",
];
export const CHECKLIST = [
  "Ověřte ISIN, emitenta a konkrétní listing; ticker může být na různých burzách odlišný.",
  "Přečtěte aktuální KID/prospekt a rizikovou kategorii. Americké ETF nemusí být českému retailu dostupné.",
  "Zkontrolujte u svého brokera dostupnost a podporované měny; UCITS není garance dostupnosti.",
  "Porovnejte index, složení a expozici. Stejný modelový výnos neznamená stejné skutečné výsledky.",
  "Rozhodněte, zda chcete akumulaci nebo distribuci; zvažte reinvestování a vlastní daňovou situaci.",
  "Započtěte poplatky brokera, spread a směnu měn. TER není úplný účet vašich investičních nákladů.",
  "Zvažte velikost fondu, likviditu a tracking difference z datovaných zdrojů; zde je nehodnotíme.",
  "Ověřte, zda horizont a riziko odpovídají vašim potřebám; náš scénář nedoporučuje konkrétní nákup.",
];
export function buildReport(scenario: Scenario, ids: [EtfId, EtfId], generatedAt = new Date().toISOString()): PersonalReport {
  scenarioSchema.parse(scenario); etfPairSchema.parse(ids);
  const etfs: [Etf, Etf] = [getEtf(ids[0]), getEtf(ids[1])];
  const calculate = (years: number): [Projection, Projection] => [project({ ...scenario, years }, etfs[0].chargePct), project({ ...scenario, years }, etfs[1].chargePct)];
  return { version: DATA_VERSION, generatedAt, scenario: { ...scenario }, etfs, selected: calculate(scenario.years), horizons: [...new Set([5, 10, 20, 30, scenario.years])].sort((a, b) => a - b).map((years) => ({ years, results: calculate(years) })), checklist: [...CHECKLIST], assumptions: [...ASSUMPTIONS] };
}
