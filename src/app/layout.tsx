import "./globals.css";
import type { Metadata } from "next";
import React from "react";
import Nav from "../components/Nav";

export const metadata: Metadata = {
  title: "CareCircle",
  description: "CareCircle demo app",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        <Nav />
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}

