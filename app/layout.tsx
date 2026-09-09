import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClickSparks from "@/components/ui/ClickSparks";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HaiLai's Bakery and Cafe - POS & Katalog",
  description:
    "Aplikasi Point of Sale (POS) & Katalog all-in-one untuk Bakery dan Cafe HaiLai's Bakery and Cafe.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[var(--color-bg)]">
        {children}
        <ClickSparks />
      </body>
    </html>
  );
}
