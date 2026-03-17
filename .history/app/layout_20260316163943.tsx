import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Safety Eyewear Savings Calculator",
  description: "Compare the cost of no program, an employer managed program, and a fully managed safety eyewear program — with honest breakeven analysis.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
