import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DeFindex Yield — Stellar Vaults",
  description: "Earn yield on Stellar with DeFindex vaults",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
