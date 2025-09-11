import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "CareCircle  App Router",
  description: "App Router layout",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-neutral-50 antialiased">{children}</body>
    </html>
  );
}
