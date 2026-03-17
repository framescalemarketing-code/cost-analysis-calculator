import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Safety Eyewear ROI Calculator",
  description: "See the true cost of workplace eye injuries and discover how a managed safety eyewear program saves you money.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
