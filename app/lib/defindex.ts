import { DefindexSDK, SupportedNetworks } from "@defindex/sdk";
import type { VaultInfoResponse, VaultBalanceResponse, VaultApyResponse } from "@defindex/sdk";
import { DEFINDEX_API_URL, DEFINDEX_API_KEY } from "./constants";

export type { VaultInfoResponse, VaultBalanceResponse, VaultApyResponse };

/**
 * The DeFindex SDK error interceptor rejects with `error.response.data` — a plain object,
 * not an Error instance. This helper extracts a readable message from any rejection value.
 */
export function extractErrorMessage(reason: unknown): string {
  if (!reason) return "Unknown error";
  if (typeof reason === "string") return reason || "Unknown error";
  if (reason instanceof Error) return reason.message;
  if (typeof reason === "object") {
    const r = reason as Record<string, unknown>;
    if (typeof r.message === "string") return r.message;
    if (typeof r.error === "string") return r.error;
    if (typeof r.detail === "string") return r.detail;
    if (typeof r.msg === "string") return r.msg;
    try { return JSON.stringify(r); } catch { /* fallthrough */ }
  }
  return "API error";
}

export function createSDK(): DefindexSDK {
  return new DefindexSDK({
    apiKey: DEFINDEX_API_KEY || undefined,
    baseUrl: DEFINDEX_API_URL,
    defaultNetwork: SupportedNetworks.TESTNET,
  });
}

export function mapNetwork(freighterNetwork: string): SupportedNetworks {
  if (freighterNetwork === "TESTNET") return SupportedNetworks.TESTNET;
  if (freighterNetwork === "PUBLIC") return SupportedNetworks.MAINNET;
  return SupportedNetworks.TESTNET;
}

export async function fetchVaultInfo(
  sdk: DefindexSDK,
  vaultAddress: string,
  network: SupportedNetworks
): Promise<VaultInfoResponse> {
  return sdk.getVaultInfo(vaultAddress, network);
}

export async function fetchVaultBalance(
  sdk: DefindexSDK,
  vaultAddress: string,
  userAddress: string,
  network: SupportedNetworks
): Promise<VaultBalanceResponse> {
  return sdk.getVaultBalance(vaultAddress, userAddress, network);
}

export async function fetchVaultAPY(
  sdk: DefindexSDK,
  vaultAddress: string,
  network: SupportedNetworks
): Promise<VaultApyResponse> {
  return sdk.getVaultAPY(vaultAddress, network);
}

export async function buildDepositXDR(
  sdk: DefindexSDK,
  vaultAddress: string,
  amounts: number[],
  callerAddress: string,
  network: SupportedNetworks
): Promise<string> {
  const response = await sdk.depositToVault(
    vaultAddress,
    { amounts, caller: callerAddress, invest: true, slippageBps: 100 },
    network
  );
  return response.xdr;
}

export async function buildWithdrawXDR(
  sdk: DefindexSDK,
  vaultAddress: string,
  shares: number,
  callerAddress: string,
  network: SupportedNetworks
): Promise<string> {
  const response = await sdk.withdrawShares(
    vaultAddress,
    { shares, caller: callerAddress, slippageBps: 100 },
    network
  );
  return response.xdr;
}
