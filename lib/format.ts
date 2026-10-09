const moneyFormatter = new Intl.NumberFormat("cs-CZ", { style: "currency", currency: "CZK", maximumFractionDigits: 0 });
export const money = (value: number) => moneyFormatter.format(value);
export const percent = (value: number) => `${new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 4 }).format(value)} %`;
