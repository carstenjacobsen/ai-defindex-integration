export const DEFINDEX_API_URL = process.env.DEFINDEX_BASE_URL || "https://api.defindex.io";
export const DEFINDEX_API_KEY = process.env.DEFINDEX_API_KEY || "";

// Default vault addresses (leave empty — users add their own from app.defindex.io)
// The DeFindex testnet API is currently not configured; mainnet is recommended.
export const DEFAULT_TESTNET_VAULTS: string[] = [];
export const DEFAULT_MAINNET_VAULTS: string[] = [];

// Token decimal places for amount conversion
// Stellar native XLM = 7 decimal places (1 XLM = 10_000_000 stroops)
// Most Soroban tokens = 7 decimal places
export const TOKEN_DECIMALS = 7;
export const STROOPS_PER_UNIT = Math.pow(10, TOKEN_DECIMALS);

export function toSmallestUnit(amount: string | number, decimals = TOKEN_DECIMALS): number {
  return Math.round(Number(amount) * Math.pow(10, decimals));
}

export function fromSmallestUnit(amount: number, decimals = TOKEN_DECIMALS): number {
  return amount / Math.pow(10, decimals);
}
