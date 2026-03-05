"use client";

import { useState } from "react";

interface AddVaultFormProps {
  onAdd: (address: string) => void;
}

export function AddVaultForm({ onAdd }: AddVaultFormProps) {
  const [address, setAddress] = useState("");
  const [open, setOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = address.trim();
    if (trimmed.length === 56 || trimmed.length === 57) {
      onAdd(trimmed);
      setAddress("");
      setOpen(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-2xl border border-dashed border-white/20 hover:border-emerald-500/40 p-5 text-gray-600 hover:text-emerald-400 transition-colors flex items-center justify-center gap-2 text-sm"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Add Custom Vault
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5"
    >
      <p className="text-sm text-gray-400 mb-3">Enter a DeFindex vault contract address</p>
      <div className="flex gap-2">
        <input
          autoFocus
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="C... (56-57 character Stellar address)"
          className="flex-1 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 font-mono"
        />
        <button
          type="submit"
          disabled={address.trim().length < 56}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-sm font-medium transition-colors"
        >
          Add
        </button>
        <button
          type="button"
          onClick={() => { setOpen(false); setAddress(""); }}
          className="px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 text-sm transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
