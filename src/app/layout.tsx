import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "CareCircle",
  description: "Calm, coordinated care for your family",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-neutral-50 antialiased">
        {children}
      </body>
    </html>
  );
}
