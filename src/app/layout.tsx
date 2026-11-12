import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import { LicenseFilter } from "./components/license-filter";
import { FloatingDevTools } from "./components/floating-devtools";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: "%s · VeriSettle AI",
    default: "VeriSettle AI · Autonomous B2B Escrow & Settlement OS",
  },
  description: "Autonomous B2B Escrow, Multimodal 3-Way Invoice Reconciliation & Dispute Defense OS for PayPal AI Hackathon 2026",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <LicenseFilter />
        {children}
        <FloatingDevTools />
      </body>
    </html>
  );
}
