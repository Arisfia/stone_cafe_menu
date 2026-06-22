import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Stone Cafe Digital Menu",
  description: "Multilingual cafe and restaurant digital menu"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ckb" dir="rtl" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
