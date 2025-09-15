// src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import "./globals.css"; // keep global styles

export const metadata: Metadata = {
  title: "CareCircle",
  description: "Coordinate care with confidence",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-dvh antialiased bg-white text-slate-900">
        {children}
      </body>
    </html>
  );
}
