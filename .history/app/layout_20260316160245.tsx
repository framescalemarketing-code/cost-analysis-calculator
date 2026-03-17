import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Safety Eyewear Savings Calculator",
  description: "Find out what workplace eye injuries really cost your business — and how much a managed safety eyewear program can save you.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
