import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Stone Cafe",
  description: "Multilingual cafe and restaurant digital menu",
  icons: {
    icon: "/stone-cafe-logo.jpg",
    shortcut: "/stone-cafe-logo.jpg",
    apple: "/stone-cafe-logo.jpg"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ckb" dir="rtl" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
