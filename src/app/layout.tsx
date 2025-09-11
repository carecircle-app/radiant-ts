import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
<<<<<<< HEAD
  title: "CareCircle  Coordinate care with confidence",
=======
  title: "CareCircle",
  description: "Calm, coordinated care for your family",
>>>>>>> 9020dc5 (force-200 root route test (diagnose 307))
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
<<<<<<< HEAD
      <body>{children}</body>
=======
      <body className="min-h-screen bg-neutral-50 antialiased">
        {children}
      </body>
>>>>>>> 9020dc5 (force-200 root route test (diagnose 307))
    </html>
  );
}
