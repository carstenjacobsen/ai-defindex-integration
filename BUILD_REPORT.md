# DeFindex Yield App — Build Report

**Project:** `stellar-defindex-yield`
**Stack:** Next.js 16, Tailwind CSS v4, TypeScript, `@defindex/sdk` v0.1.2, `@stellar/freighter-api` v6, `@stellar/stellar-sdk` v14
**Date:** 2026-03-09

---

## Overview

A yield-earning DeFi application on the Stellar/Soroban network. Users connect their Freighter browser wallet, browse DeFindex yield vaults, deposit assets to earn yield (receiving dfTokens), monitor their positions, and withdraw by redeeming shares.

---

## Architecture Decisions

| Concern | Decision | Reason |
|---|---|---|
| DeFindex SDK placement | Server-side only (Next.js API routes) | SDK makes authenticated HTTP calls; API key must stay secret |
| Transaction signing | Client-side via Freighter | Only the user's wallet can sign their transactions |
| Transaction submission | `SorobanRpc.Server` (not Horizon) | Soroban smart contract calls require the Soroban RPC endpoint |
| Vault list | User-supplied addresses | No hardcoded defaults (testnet API was offline at build time) |

---

## Build Phases

### Phase 1 — Research

- Searched for `@defindex/sdk` on npm → found package by PaltaLabs, v0.1.2
- Located API base URL: `https://api.defindex.io`
- Inspected installed SDK TypeScript types to extract exact interfaces before writing any code
- Cross-referenced the existing `stellar-freighter-wallet` project for reusable patterns

Key SDK interfaces discovered:

```typescript
// Deposit
DepositToVaultParams { amounts: number[], caller: string, invest: boolean, slippageBps?: number }

// Withdraw
WithdrawSharesParams { shares: number, caller: string, slippageBps?: number }

// Vault info
VaultInfoResponse { name, symbol, roles, assets[], totalManagedFunds, feesBps, apy }

// User balance
VaultBalanceResponse { dfTokens: number, underlyingBalance: number[] }

// Transaction XDR response
VaultTransactionResponse { xdr: string, simulationResponse, functionName, params[] }

// Networks
SupportedNetworks.TESTNET = "testnet"
SupportedNetworks.MAINNET = "mainnet"
```

---

### Phase 2 — Project Scaffolding

- Created `/Users/carsten.jacobsen/Documents/Claude Code/stellar-defindex-yield`
- Configured port 3003 (3001 = passkey wallet, 3002 = freighter wallet)
- Added entry to root `.claude/launch.json` with `runtimeExecutable: "/usr/local/bin/node"` and hardcoded port in `runtimeArgs` (required by the preview tool)
- Set `serverExternalPackages: ["@defindex/sdk"]` in `next.config.ts` to prevent Next.js from bundling the SDK

---

### Phase 3 — Core Files

```
app/
  lib/
    constants.ts     – token decimals, unit converters, default vault arrays
    freighter.ts     – connect, disconnect, sign XDR helpers
    stellar.ts       – Horizon + SorobanRpc helpers, submitSorobanTransaction
    defindex.ts      – SDK factory, network mapper, XDR builders, extractErrorMessage
  api/
    vaults/
      route.ts                    – GET all vaults
      [address]/route.ts          – GET single vault (+ user balance)
      [address]/deposit/route.ts  – POST build deposit XDR
      [address]/withdraw/route.ts – POST build withdraw XDR
    send/route.ts                 – POST submit signed XDR
  hooks/
    useFreighter.ts   – wallet state (connect, sign, balance)
    useVaults.ts      – vault list state + custom address management
  components/
    ConnectButton.tsx    – Install / Connect / Disconnect with network badge
    VaultCard.tsx        – vault info, APY, position, deposit/withdraw buttons
    DepositModal.tsx     – multi-asset deposit form
    WithdrawModal.tsx    – percentage slider + 25/50/75/100% presets
    AddVaultForm.tsx     – add custom vault contract address
  page.tsx
  layout.tsx
  globals.css
```

---

## Gotchas & Issues Discovered

### 1. `[object Object]` shown in vault cards

**Symptom:** Vault cards displayed the literal string `[object Object]` as the error message.

**Root cause:** The DeFindex SDK's HTTP interceptor calls `Promise.reject(error.response.data)` — it rejects with a plain JavaScript object, not an `Error` instance. Code using `String(reason)` or `err instanceof Error ? err.message : String(err)` both produce `"[object Object]"` for plain objects.

**Fix:** Centralized error extraction helper in `app/lib/defindex.ts`:

```typescript
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
```

Applied to all API routes, replacing all prior `String(reason)` calls.

---

### 2. DeFindex testnet API is offline

**Symptom:** Any testnet vault address returned errors even after fixing the error message display.

**Discovery:** Called `GET https://api.defindex.io/health` — response confirmed testnet database is "not configured and unhealthy". Mainnet is healthy.

**Fix:** Cleared the `DEFAULT_TESTNET_VAULTS` array in `constants.ts`. Added a "How to add a vault" guide on the page directing users to mainnet vault addresses from [app.defindex.io](https://app.defindex.io).

---

### 3. DeFindex API requires authentication ("forbidden resource")

**Symptom:** Adding a vault address returned `"forbidden resource"` — correctly surfaced by `extractErrorMessage`, but the UX was confusing (red error, no guidance).

**Root cause:** The DeFindex API requires a Bearer API key for all vault data calls.

**Fix (UX layer):**
- Added `isAuthError()` helper in `useVaults.ts` detecting `forbidden` / `unauthorized` / `401` / `403`
- Exposed `needsApiKey` boolean from the hook
- Added amber warning banner on the page with step-by-step instructions when `needsApiKey` is true
- VaultCard renders auth errors in amber with "API key required — see banner above" instead of a red error

**Fix (functional):** User obtained API key from DeFindex and added to `.env.local`:
```
DEFINDEX_API_KEY=sk_...
```
Server restarted to pick up the new env var.

---

### 4. `SorobanRpc` renamed to `rpc` in stellar-sdk v14

**Symptom:** Deposit transaction failed with:
`Cannot read properties of undefined (reading 'Server')`

**Root cause:** `@stellar/stellar-sdk` v14 renamed the `SorobanRpc` namespace to `rpc`. The code used `StellarSdk.SorobanRpc.Server(...)` which is `undefined` in v14.

**Discovery:** Confirmed with:
```bash
node -e "const s = require('@stellar/stellar-sdk'); console.log(typeof s.SorobanRpc, typeof s.rpc)"
# undefined  object
```

**Fix:** Updated `app/lib/stellar.ts`:

| Before | After |
|---|---|
| `StellarSdk.SorobanRpc.Server` | `StellarSdk.rpc.Server` |
| `StellarSdk.SorobanRpc.Api.GetTransactionStatus.NOT_FOUND` | `StellarSdk.rpc.Api.GetTransactionStatus.NOT_FOUND` |
| `StellarSdk.SorobanRpc.Api.GetTransactionStatus.SUCCESS` | `StellarSdk.rpc.Api.GetTransactionStatus.SUCCESS` |

---

### 5. launch.json configuration quirks

The Claude preview tool requires a specific `launch.json` format:
- `runtimeExecutable` must be an absolute path (`/usr/local/bin/node`) — not just `node`
- Port must be hardcoded in `runtimeArgs` (e.g. `["node_modules/.bin/next", "dev", "--port", "3003"]`), not just in the `port` field
- A `cwd` field pointing to the project directory is required when the launch.json is at the repo root

---

## Final File Structure

```
stellar-defindex-yield/
├── app/
│   ├── api/
│   │   ├── send/route.ts
│   │   └── vaults/
│   │       ├── route.ts
│   │       └── [address]/
│   │           ├── route.ts
│   │           ├── deposit/route.ts
│   │           └── withdraw/route.ts
│   ├── components/
│   │   ├── AddVaultForm.tsx
│   │   ├── ConnectButton.tsx
│   │   ├── DepositModal.tsx
│   │   ├── VaultCard.tsx
│   │   └── WithdrawModal.tsx
│   ├── hooks/
│   │   ├── useFreighter.ts
│   │   └── useVaults.ts
│   ├── lib/
│   │   ├── constants.ts
│   │   ├── defindex.ts
│   │   ├── freighter.ts
│   │   └── stellar.ts
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── .env.local
├── next.config.ts
├── package.json
└── tsconfig.json
```
