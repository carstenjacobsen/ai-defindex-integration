"use client";

import { useState } from "react";
import { useFreighter } from "@/hooks/useFreighter";
import { useVaults } from "@/hooks/useVaults";
import { ConnectButton } from "@/components/ConnectButton";
import { VaultCard } from "@/components/VaultCard";
import { DepositModal } from "@/components/DepositModal";
import { WithdrawModal } from "@/components/WithdrawModal";
import { AddVaultForm } from "@/components/AddVaultForm";
import type { VaultInfoResponse } from "@/lib/defindex";

interface ModalState {
  type: "deposit" | "withdraw";
  vaultAddress: string;
  vaultInfo: VaultInfoResponse;
  balance?: { dfTokens: number; underlyingBalance: number[] };
}

export default function Home() {
  const {
    isInstalled,
    isConnected,
    address,
    network,
    networkPassphrase,
    balance,
    loading: walletLoading,
    error: walletError,
    connect,
    disconnect,
    refreshBalance,
    sign,
  } = useFreighter();

  const { vaults, loading: vaultsLoading, addVault, refreshVault, refetch, needsApiKey } = useVaults(
    network,
    address
  );

  const [modal, setModal] = useState<ModalState | null>(null);

  const openDeposit = (vaultAddress: string, info: VaultInfoResponse) => {
    setModal({ type: "deposit", vaultAddress, vaultInfo: info });
  };

  const openWithdraw = (
    vaultAddress: string,
    info: VaultInfoResponse,
    bal: { dfTokens: number; underlyingBalance: number[] }
  ) => {
    setModal({ type: "withdraw", vaultAddress, vaultInfo: info, balance: bal });
  };

  const closeModal = () => setModal(null);

  const onTxSuccess = () => {
    if (modal?.vaultAddress) refreshVault(modal.vaultAddress);
    refreshBalance();
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-emerald-950/20 via-gray-950 to-teal-950/20 pointer-events-none" />

      <div className="relative max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white leading-none">DeFindex Yield</h1>
              <p className="text-xs text-gray-500 mt-0.5">Stellar · Soroban</p>
            </div>
          </div>

          <ConnectButton
            isInstalled={isInstalled}
            isConnected={isConnected}
            loading={walletLoading}
            address={address}
            network={network}
            onConnect={connect}
            onDisconnect={disconnect}
          />
        </header>

        {/* Wallet error */}
        {walletError && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-300">
            {walletError}
          </div>
        )}

        {/* API key required banner */}
        {needsApiKey && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex gap-3">
            <svg className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-300 mb-1">DeFindex API Key Required</p>
              <p className="text-xs text-amber-400/70 leading-relaxed mb-2">
                The DeFindex API returned &ldquo;forbidden resource&rdquo; — an API key is needed to access vault data.
              </p>
              <ol className="text-xs text-amber-400/60 space-y-1 list-decimal list-inside">
                <li>Get your API key at <a href="https://defindex.io" target="_blank" rel="noopener noreferrer" className="text-amber-300 hover:underline">defindex.io</a></li>
                <li>Add <code className="bg-white/10 px-1 rounded text-amber-300">DEFINDEX_API_KEY=your_key</code> to <code className="bg-white/10 px-1 rounded text-amber-300">.env.local</code></li>
                <li>Restart the dev server</li>
              </ol>
            </div>
          </div>
        )}

        {/* Not installed */}
        {!walletLoading && !isInstalled && (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-600/20 to-teal-600/20 border border-white/10 flex items-center justify-center text-4xl mx-auto mb-6">
              🌿
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Freighter Required</h2>
            <p className="text-gray-400 mb-8 max-w-sm mx-auto text-sm leading-relaxed">
              Install the Freighter browser extension to connect your Stellar wallet and start
              earning yield with DeFindex.
            </p>
            <a
              href="https://freighter.app"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-colors"
            >
              Install Freighter
            </a>
          </div>
        )}

        {/* Loading */}
        {walletLoading && (
          <div className="text-center py-20">
            <svg className="w-10 h-10 text-emerald-500 animate-spin mx-auto mb-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-gray-400 text-sm">Connecting…</p>
          </div>
        )}

        {/* Main content */}
        {!walletLoading && isInstalled && (
          <>
            {/* Wallet summary (when connected) */}
            {isConnected && address && balance && (
              <div className="mb-6 p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-wrap items-center gap-4">
                <div>
                  <p className="text-xs text-gray-500">Wallet</p>
                  <p className="text-sm font-mono text-gray-300">
                    {address.slice(0, 8)}…{address.slice(-8)}
                  </p>
                </div>
                <div className="h-8 w-px bg-white/10" />
                <div>
                  <p className="text-xs text-gray-500">XLM Balance</p>
                  <p className="text-sm font-semibold text-white">
                    {parseFloat(balance.xlm).toLocaleString(undefined, { maximumFractionDigits: 4 })} XLM
                  </p>
                </div>
                {balance.assets.map((a) => (
                  <div key={`${a.code}-${a.issuer}`}>
                    <p className="text-xs text-gray-500">{a.code}</p>
                    <p className="text-sm font-semibold text-white">
                      {parseFloat(a.balance).toLocaleString(undefined, { maximumFractionDigits: 4 })} {a.code}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Not connected prompt */}
            {!isConnected && (
              <div className="mb-6 p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">Connect to earn yield</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Connect your Freighter wallet to deposit into DeFindex vaults and start earning
                  </p>
                </div>
                <button
                  onClick={connect}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors flex-shrink-0"
                >
                  Connect
                </button>
              </div>
            )}

            {/* Vaults section */}
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">
                  Available Vaults
                  {network && (
                    <span className="ml-2 text-xs font-normal text-gray-500">
                      on {network === "PUBLIC" ? "Mainnet" : network}
                    </span>
                  )}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">Deposit assets and earn yield automatically</p>
              </div>
              <button
                onClick={refetch}
                disabled={vaultsLoading}
                className="p-2 rounded-lg hover:bg-white/10 text-gray-500 hover:text-white transition-colors disabled:opacity-30"
                title="Refresh vaults"
              >
                <svg
                  className={`w-4 h-4 ${vaultsLoading ? "animate-spin" : ""}`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>

            {/* Loading vaults */}
            {vaultsLoading && vaults.length === 0 && (
              <div className="grid gap-4 sm:grid-cols-2 mb-4">
                {[1, 2].map((i) => (
                  <div key={i} className="rounded-2xl bg-white/5 border border-white/10 p-5 animate-pulse">
                    <div className="h-5 w-28 bg-white/10 rounded mb-3" />
                    <div className="h-4 w-16 bg-white/10 rounded mb-4" />
                    <div className="h-8 w-full bg-white/10 rounded" />
                  </div>
                ))}
              </div>
            )}

            {/* No network selected */}
            {!network && !walletLoading && (
              <div className="text-center py-12 text-gray-600">
                Connect your wallet to add vault addresses
              </div>
            )}

            {/* Vault grid */}
            {vaults.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2 mb-4">
                {vaults.map((vault) => (
                  <VaultCard
                    key={vault.address}
                    address={vault.address}
                    info={vault.info}
                    apy={vault.apy}
                    balance={vault.balance}
                    loading={vault.loading}
                    error={vault.error}
                    isConnected={isConnected}
                    onDeposit={() => vault.info && openDeposit(vault.address, vault.info)}
                    onWithdraw={() =>
                      vault.info &&
                      vault.balance &&
                      openWithdraw(vault.address, vault.info, vault.balance)
                    }
                    onRefresh={() => refreshVault(vault.address)}
                  />
                ))}
              </div>
            )}

            {/* Add custom vault */}
            {network && <AddVaultForm onAdd={addVault} />}

            {/* Getting started guide */}
            {network && vaults.length === 0 && !vaultsLoading && (
              <div className="mb-4 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20">
                <p className="text-sm font-semibold text-amber-400 mb-2">How to add a vault</p>
                <ol className="text-xs text-gray-400 space-y-1.5 list-decimal list-inside leading-relaxed">
                  <li>
                    Visit{" "}
                    <a href="https://app.defindex.io" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">
                      app.defindex.io
                    </a>{" "}
                    to browse available vaults
                  </li>
                  <li>Copy a vault contract address (starts with C…)</li>
                  <li>Paste it into the &ldquo;Add Custom Vault&rdquo; field below</li>
                  <li>
                    For API access, set{" "}
                    <code className="text-gray-300 bg-white/5 px-1 rounded">DEFINDEX_API_KEY</code>{" "}
                    in <code className="text-gray-300 bg-white/5 px-1 rounded">.env.local</code>
                  </li>
                </ol>
              </div>
            )}

            {/* Info note */}
            <div className="mt-4 p-4 rounded-xl bg-white/3 border border-white/5">
              <p className="text-xs text-gray-600 leading-relaxed">
                DeFindex vaults allocate your assets across Stellar DeFi strategies (Blend,
                Soroswap, etc.) to earn yield. dfTokens represent your share and accrue value
                over time. The DeFindex API requires an API key — get one at{" "}
                <a href="https://defindex.io" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gray-400">
                  defindex.io
                </a>
                .
              </p>
            </div>
          </>
        )}

        {/* Footer */}
        <footer className="mt-10 text-center">
          <p className="text-xs text-gray-700">
            Powered by{" "}
            <a href="https://defindex.io" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-500">
              DeFindex
            </a>{" "}
            &{" "}
            <a href="https://stellar.org" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-500">
              Stellar
            </a>
          </p>
        </footer>
      </div>

      {/* Modals */}
      {modal?.type === "deposit" && address && network && networkPassphrase && (
        <DepositModal
          vault={modal.vaultInfo}
          vaultAddress={modal.vaultAddress}
          network={network}
          onSign={sign}
          onClose={closeModal}
          onSuccess={onTxSuccess}
          callerAddress={address}
        />
      )}

      {modal?.type === "withdraw" && modal.balance && address && network && networkPassphrase && (
        <WithdrawModal
          vault={modal.vaultInfo}
          vaultAddress={modal.vaultAddress}
          network={network}
          onSign={sign}
          onClose={closeModal}
          onSuccess={onTxSuccess}
          callerAddress={address}
          dfTokens={modal.balance.dfTokens}
          underlyingBalance={modal.balance.underlyingBalance}
        />
      )}
    </div>
  );
}
