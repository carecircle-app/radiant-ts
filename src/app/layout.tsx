﻿import type { Metadata } from "next";

export const metadata: Metadata = { title: "CareCircle  App Router" };

export default function RootLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
