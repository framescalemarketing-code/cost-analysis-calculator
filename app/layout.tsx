import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cost Analysis Calculator",
  description: "Safety eyewear program injury and operating cost calculator.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
